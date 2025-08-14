import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { transactions } from '../../../drizzle/schema';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { TransactionSchema } from '../../../lib/validation';
export const runtime = 'nodejs';

const TxSchema = TransactionSchema;

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await db.select().from(transactions).where(eq(transactions.userId, userId));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = TxSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const v = parsed.data;
  const now = new Date();
  const occurredAt = v.occurredAt ? new Date(v.occurredAt) : now;
  let nextRunAt: Date | null = null;
  if (v.recurrence && v.recurrence !== 'none') {
    nextRunAt = calcNextRun(occurredAt, v.recurrence);
  }
  const inserted = await db.insert(transactions).values({
    userId,
    categoryId: v.categoryId,
    type: v.type,
    amount: v.amount.toString(),
    currency: (v.currency || 'USD').toUpperCase(),
    description: v.description,
    recurrence: v.recurrence || 'none',
    occurredAt,
    nextRunAt
  }).returning();
  return NextResponse.json(inserted[0]);
}

function calcNextRun(date: Date, recurrence: string) {
  const d = new Date(date);
  if (recurrence === 'daily') d.setDate(d.getDate() + 1);
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  return d;
}

// Update transaction (expects id in search params)
export async function PUT(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Allow id either as search param (?id=) or JSON body { id }
  let id = req.nextUrl.searchParams.get('id');
  let body: any = {};
  try { body = await req.json(); } catch { /* no body */ }
  if (!id && body.id) id = body.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const parsed = TxSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const v = parsed.data;
  let nextRunAt: Date | undefined;
  if (v.recurrence && v.recurrence !== 'none') {
    nextRunAt = calcNextRun(new Date(), v.recurrence);
  }
  const updated = await db.update(transactions)
    .set({
      categoryId: v.categoryId,
      type: v.type as any,
      amount: v.amount ? v.amount.toString() : undefined,
      currency: v.currency?.toUpperCase(),
      description: v.description,
      recurrence: v.recurrence as any,
      nextRunAt
    })
    .where(and(eq(transactions.id, id as any), eq(transactions.userId, userId)))
    .returning();
  if (!updated[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated[0]);
}

// Delete transaction
export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let id = req.nextUrl.searchParams.get('id');
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (!id && body.id) id = body.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const deleted = await db.delete(transactions).where(and(eq(transactions.id, id as any), eq(transactions.userId, userId))).returning();
  if (!deleted[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

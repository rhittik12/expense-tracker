import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { transactions } from '../../../drizzle/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, and, lte } from 'drizzle-orm';
export const runtime = 'nodejs';

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const now = new Date();
  const due = await db.select().from(transactions).where(and(eq(transactions.userId, userId), lte(transactions.nextRunAt as any, now as any)));
  const created: any[] = [];
  for (const t of due) {
    if (t.recurrence === 'none') continue;
    const nextRun = calcNextRun(t.nextRunAt || t.occurredAt, t.recurrence);
    const [occ] = await db.insert(transactions).values({
      userId,
      categoryId: t.categoryId,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      recurrence: t.recurrence,
      occurredAt: new Date(),
      nextRunAt: nextRun
    }).returning();
    created.push(occ);
    await db.update(transactions).set({ nextRunAt: nextRun }).where(eq(transactions.id, t.id));
  }
  return NextResponse.json({ created: created.length });
}

function calcNextRun(date: Date, recurrence: string) {
  const d = new Date(date);
  if (recurrence === 'daily') d.setDate(d.getDate() + 1);
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  return d;
}

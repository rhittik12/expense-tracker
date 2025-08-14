import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { categories } from '../../../drizzle/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { CategorySchema } from '../../../lib/validation';
export const runtime = 'nodejs';


export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let data = await db.select().from(categories).where(eq(categories.userId, userId));
  if (data.length === 0) {
    const defaults = [
      { name: 'Food', color: '#f87171', budget: '300' },
      { name: 'Transport', color: '#60a5fa', budget: '150' },
      { name: 'Entertainment', color: '#a78bfa', budget: '120' },
      { name: 'Utilities', color: '#fbbf24', budget: '200' },
      { name: 'Rent', color: '#34d399', budget: '1000' }
    ];
    await db.insert(categories).values(defaults.map(d => ({ ...d, userId })));
    data = await db.select().from(categories).where(eq(categories.userId, userId));
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = CategorySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const v = parsed.data;
  const inserted = await db.insert(categories).values({
    userId,
    name: v.name,
    color: v.color,
    budget: v.budget ? v.budget.toString() : '0'
  }).returning();
  return NextResponse.json(inserted[0]);
}

export async function PUT(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const json = await req.json();
  const parsed = CategorySchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const v = parsed.data;
  const updated = await db.update(categories)
    .set({
      name: v.name,
      color: v.color,
      budget: v.budget?.toString()
    })
    .where(eq(categories.id, id as any))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await db.delete(categories).where(eq(categories.id, id as any));
  return NextResponse.json({ success: true });
}

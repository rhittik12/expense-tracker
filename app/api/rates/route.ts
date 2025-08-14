import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '../../../lib/db';
import { exchangeRates } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

async function fetchRates(base: string) {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error('Failed to fetch rates');
  const json = await res.json();
  return json.rates as Record<string, number>;
}

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await clerkClient().users.getUser(userId);
  const role = (user.publicMetadata.role as string) || 'user';
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const base = 'USD';
  try {
    const rates = await fetchRates(base);
    const important = ['EUR','GBP','INR','JPY','CAD','AUD'];
    for (const cur of important) {
      const rate = rates[cur];
      if (!rate) continue;
      await db.insert(exchangeRates).values({ base, target: cur, rate: rate.toString() }).onConflictDoUpdate({
        target: [exchangeRates.base, exchangeRates.target],
        set: { rate: rate.toString(), fetchedAt: new Date() as any }
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const base = 'USD';
  const rows = await db.select().from(exchangeRates).where(eq(exchangeRates.base, base));
  return NextResponse.json({ base, rates: Object.fromEntries(rows.map(r=>[r.target, Number(r.rate)])) });
}

import { db } from './db';
import { categories, transactions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function getBudgetStatuses(userId: string) {
  const cats = await db.select().from(categories).where(eq(categories.userId, userId));
  const txs = await db.select().from(transactions).where(eq(transactions.userId, userId));
  return cats.map(c => {
    const spent = txs.filter(t => t.categoryId === c.id && t.type === 'expense').reduce((a, b: any) => a + Number(b.amount), 0);
    const budget = Number(c.budget || 0);
    return {
      category: c,
      spent,
      budget,
      percent: budget ? Math.min(100, (spent / budget) * 100) : 0,
      exceeded: budget ? spent > budget : false
    };
  });
}

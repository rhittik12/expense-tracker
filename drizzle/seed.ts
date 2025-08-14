import { db } from '../lib/db';
import { categories, transactions } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
  const userId = 'seed-user';
  const existing = await db.select().from(categories).where(eq(categories.userId, userId));
  if (existing.length === 0) {
    await db.insert(categories).values([
      { userId, name: 'Food', color: '#f87171', budget: '300' },
      { userId, name: 'Transport', color: '#60a5fa', budget: '150' },
      { userId, name: 'Entertainment', color: '#a78bfa', budget: '200' }
    ]);
  }

  await db.insert(transactions).values([
    { userId, type: 'income', amount: '2500', description: 'Salary', currency: 'USD', recurrence: 'monthly' },
    { userId, type: 'expense', amount: '50', description: 'Groceries', currency: 'USD', recurrence: 'none' },
    { userId, type: 'expense', amount: '25', description: 'Bus pass', currency: 'USD', recurrence: 'weekly' }
  ]);

  console.log('Seed complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

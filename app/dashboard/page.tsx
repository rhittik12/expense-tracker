import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardShell from '../../components/DashboardShell';
import { db } from '../../lib/db';
import { transactions, categories } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');
  // Server-side prefetch for faster TTFB & SEO
  const [tx, cats] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, userId)),
    db.select().from(categories).where(eq(categories.userId, userId))
  ]);
  return <DashboardShell initialTransactions={tx} initialCategories={cats} />;
}

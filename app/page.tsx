import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export default function HomePage() {
  const { userId } = auth();
  return (
    <main className="p-6 space-y-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expense Tracker</h1>
        <nav className="space-x-4">
          {userId ? (
            <Link className="underline" href="/dashboard">Dashboard</Link>
          ) : (
            <Link className="underline" href="/sign-in">Sign In</Link>
          )}
        </nav>
      </header>
      <p className="text-muted-foreground">Track your finances, set budgets, and visualize spending.</p>
    </main>
  );
}

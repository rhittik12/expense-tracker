import '../styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';
import { ToastProvider } from '../components/Toaster';

export const metadata = {
  title: 'Expense Tracker',
  description: 'Track expenses, incomes, budgets and more.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ServiceWorkerRegister />
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

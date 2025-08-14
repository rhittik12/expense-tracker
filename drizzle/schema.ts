import { pgTable, uuid, varchar, timestamp, numeric, boolean, text, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const recurrenceEnum = pgEnum('recurrence', ['none','daily','weekly','monthly']);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 191 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }).notNull(),
  budget: numeric('budget', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 191 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  type: varchar('type', { length: 10 }).notNull(), // income | expense
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  description: text('description'),
  recurrence: recurrenceEnum('recurrence').default('none').notNull(),
  nextRunAt: timestamp('next_run_at'),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  base: varchar('base', { length: 3 }).notNull(),
  target: varchar('target', { length: 3 }).notNull(),
  rate: numeric('rate', { precision: 14, scale: 6 }).notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull()
});

export const emailReports = pgTable('email_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 191 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM
  sent: boolean('sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insertCategoryColumns = {
  name: categories.name,
  color: categories.color,
  budget: categories.budget
};

export const insertTransactionColumns = {
  categoryId: transactions.categoryId,
  type: transactions.type,
  amount: transactions.amount,
  currency: transactions.currency,
  description: transactions.description,
  recurrence: transactions.recurrence,
  occurredAt: transactions.occurredAt
};

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

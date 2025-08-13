import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define the task status enum
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed']);

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  due_date: timestamp('due_date').notNull(),
  status: taskStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Task = typeof tasksTable.$inferSelect; // For SELECT operations
export type NewTask = typeof tasksTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { tasks: tasksTable };
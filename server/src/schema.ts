import { z } from 'zod';

// Task status enum
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

// Sort direction enum
export const sortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof sortDirectionSchema>;

// Main task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.coerce.date(),
  status: taskStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  due_date: z.coerce.date(),
  status: taskStatusSchema.default('pending')
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().optional(),
  status: taskStatusSchema.optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Query schema for filtering and sorting tasks
export const getTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  sortBy: z.enum(['due_date', 'created_at', 'title']).default('due_date'),
  sortDirection: sortDirectionSchema.default('asc')
});

export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;

// Schema for deleting a task
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;
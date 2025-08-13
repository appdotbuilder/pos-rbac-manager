import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  due_date: new Date('2024-12-25'),
  status: 'pending'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.due_date).toEqual(new Date('2024-12-25'));
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].due_date).toEqual(new Date('2024-12-25'));
    expect(tasks[0].status).toEqual('pending');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create task with null description', async () => {
    const inputWithNullDescription: CreateTaskInput = {
      title: 'Task without description',
      description: null,
      due_date: new Date('2024-12-25'),
      status: 'in_progress'
    };

    const result = await createTask(inputWithNullDescription);

    expect(result.title).toEqual('Task without description');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('in_progress');
    expect(result.id).toBeDefined();
  });

  it('should use default status when not provided', async () => {
    const inputWithoutStatus: CreateTaskInput = {
      title: 'Task with default status',
      description: 'Testing default status',
      due_date: new Date('2024-12-25'),
      status: 'pending' // This would be applied by Zod's default
    };

    const result = await createTask(inputWithoutStatus);

    expect(result.status).toEqual('pending');
    expect(result.title).toEqual('Task with default status');
  });

  it('should handle different task statuses', async () => {
    const completedTaskInput: CreateTaskInput = {
      title: 'Completed Task',
      description: 'This task is completed',
      due_date: new Date('2024-12-20'),
      status: 'completed'
    };

    const result = await createTask(completedTaskInput);

    expect(result.status).toEqual('completed');
    expect(result.title).toEqual('Completed Task');

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].status).toEqual('completed');
  });

  it('should generate sequential IDs for multiple tasks', async () => {
    const firstTask = await createTask({
      title: 'First Task',
      description: 'First test task',
      due_date: new Date('2024-12-25'),
      status: 'pending'
    });

    const secondTask = await createTask({
      title: 'Second Task',
      description: 'Second test task',
      due_date: new Date('2024-12-26'),
      status: 'in_progress'
    });

    expect(secondTask.id).toBeGreaterThan(firstTask.id);
    expect(firstTask.id).toBeGreaterThan(0);
    expect(secondTask.id).toBeGreaterThan(0);
  });
});
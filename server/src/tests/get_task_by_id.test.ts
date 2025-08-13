import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTaskById } from '../handlers/get_task_by_id';

// Test task input
const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing get by ID',
  due_date: new Date('2024-12-31T23:59:59Z'),
  status: 'pending'
};

describe('getTaskById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when found by ID', async () => {
    // Create a task first
    const insertResult = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        due_date: testTaskInput.due_date,
        status: testTaskInput.status
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Test getting the task by ID
    const result = await getTaskById(createdTask.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing get by ID');
    expect(result!.due_date).toEqual(testTaskInput.due_date);
    expect(result!.status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task is not found', async () => {
    // Try to get a task with ID that doesn't exist
    const result = await getTaskById(999);

    expect(result).toBeNull();
  });

  it('should return the correct task when multiple tasks exist', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'First description',
        due_date: new Date('2024-01-01'),
        status: 'pending'
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'Second description',
        due_date: new Date('2024-02-01'),
        status: 'in_progress'
      })
      .returning()
      .execute();

    // Test getting specific tasks by ID
    const result1 = await getTaskById(task1[0].id);
    const result2 = await getTaskById(task2[0].id);

    expect(result1).not.toBeNull();
    expect(result1!.title).toEqual('First Task');
    expect(result1!.description).toEqual('First description');
    expect(result1!.status).toEqual('pending');

    expect(result2).not.toBeNull();
    expect(result2!.title).toEqual('Second Task');
    expect(result2!.description).toEqual('Second description');
    expect(result2!.status).toEqual('in_progress');
  });

  it('should handle tasks with null description', async () => {
    // Create a task with null description
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Task Without Description',
        description: null,
        due_date: new Date('2024-06-01'),
        status: 'completed'
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Test getting the task by ID
    const result = await getTaskById(createdTask.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Task Without Description');
    expect(result!.description).toBeNull();
    expect(result!.status).toEqual('completed');
  });

  it('should handle tasks with different statuses', async () => {
    // Create tasks with different statuses
    const pendingTask = await db.insert(tasksTable)
      .values({
        title: 'Pending Task',
        description: 'Pending description',
        due_date: new Date('2024-03-01'),
        status: 'pending'
      })
      .returning()
      .execute();

    const inProgressTask = await db.insert(tasksTable)
      .values({
        title: 'In Progress Task',
        description: 'In progress description',
        due_date: new Date('2024-04-01'),
        status: 'in_progress'
      })
      .returning()
      .execute();

    const completedTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'Completed description',
        due_date: new Date('2024-05-01'),
        status: 'completed'
      })
      .returning()
      .execute();

    // Test getting each task by ID
    const pendingResult = await getTaskById(pendingTask[0].id);
    const inProgressResult = await getTaskById(inProgressTask[0].id);
    const completedResult = await getTaskById(completedTask[0].id);

    expect(pendingResult!.status).toEqual('pending');
    expect(inProgressResult!.status).toEqual('in_progress');
    expect(completedResult!.status).toEqual('completed');
  });
});
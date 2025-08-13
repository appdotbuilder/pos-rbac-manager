import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksQuery, type TaskStatus } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test data
const testTasks = [
  {
    title: 'First Task',
    description: 'First task description',
    due_date: new Date('2024-01-15'),
    status: 'pending' as TaskStatus
  },
  {
    title: 'Second Task', 
    description: 'Second task description',
    due_date: new Date('2024-01-10'),
    status: 'in_progress' as TaskStatus
  },
  {
    title: 'Third Task',
    description: null,
    due_date: new Date('2024-01-20'),
    status: 'completed' as TaskStatus
  },
  {
    title: 'Alpha Task',
    description: 'Alphabetically first task',
    due_date: new Date('2024-01-25'),
    status: 'pending' as TaskStatus
  }
];

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all tasks when no filters applied', async () => {
    // Insert test data
    await db.insert(tasksTable).values(testTasks).execute();

    const query: GetTasksQuery = {
      sortBy: 'due_date',
      sortDirection: 'asc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(4);
    expect(result[0].title).toEqual('Second Task'); // Earliest due date
    expect(result[1].title).toEqual('First Task');
    expect(result[2].title).toEqual('Third Task');
    expect(result[3].title).toEqual('Alpha Task'); // Latest due date
  });

  it('should filter tasks by status', async () => {
    // Insert test data
    await db.insert(tasksTable).values(testTasks).execute();

    const query: GetTasksQuery = {
      status: 'pending',
      sortBy: 'due_date',
      sortDirection: 'asc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(2);
    result.forEach(task => {
      expect(task.status).toEqual('pending');
    });
    expect(result[0].title).toEqual('First Task'); // Earlier due date
    expect(result[1].title).toEqual('Alpha Task');
  });

  it('should sort tasks by title in ascending order', async () => {
    // Insert test data
    await db.insert(tasksTable).values(testTasks).execute();

    const query: GetTasksQuery = {
      sortBy: 'title',
      sortDirection: 'asc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(4);
    expect(result[0].title).toEqual('Alpha Task');
    expect(result[1].title).toEqual('First Task');
    expect(result[2].title).toEqual('Second Task');
    expect(result[3].title).toEqual('Third Task');
  });

  it('should sort tasks by title in descending order', async () => {
    // Insert test data
    await db.insert(tasksTable).values(testTasks).execute();

    const query: GetTasksQuery = {
      sortBy: 'title',
      sortDirection: 'desc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(4);
    expect(result[0].title).toEqual('Third Task');
    expect(result[1].title).toEqual('Second Task');
    expect(result[2].title).toEqual('First Task');
    expect(result[3].title).toEqual('Alpha Task');
  });

  it('should sort tasks by due_date in descending order', async () => {
    // Insert test data
    await db.insert(tasksTable).values(testTasks).execute();

    const query: GetTasksQuery = {
      sortBy: 'due_date',
      sortDirection: 'desc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(4);
    expect(result[0].title).toEqual('Alpha Task'); // Latest due date
    expect(result[1].title).toEqual('Third Task');
    expect(result[2].title).toEqual('First Task');
    expect(result[3].title).toEqual('Second Task'); // Earliest due date
  });

  it('should sort tasks by created_at', async () => {
    // Insert tasks one by one to ensure different created_at timestamps
    const firstTask = await db.insert(tasksTable).values([testTasks[0]]).returning().execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const secondTask = await db.insert(tasksTable).values([testTasks[1]]).returning().execute();

    const query: GetTasksQuery = {
      sortBy: 'created_at',
      sortDirection: 'asc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(firstTask[0].id);
    expect(result[1].id).toEqual(secondTask[0].id);
  });

  it('should combine filtering and sorting correctly', async () => {
    // Insert test data
    await db.insert(tasksTable).values(testTasks).execute();

    const query: GetTasksQuery = {
      status: 'pending',
      sortBy: 'title',
      sortDirection: 'desc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(2);
    result.forEach(task => {
      expect(task.status).toEqual('pending');
    });
    expect(result[0].title).toEqual('First Task');
    expect(result[1].title).toEqual('Alpha Task');
  });

  it('should return empty array when no tasks match filter', async () => {
    // Insert only tasks that are not in_progress to test empty result
    const nonInProgressTasks = testTasks.filter(t => t.status !== 'in_progress');
    await db.insert(tasksTable).values(nonInProgressTasks).execute();

    const query: GetTasksQuery = {
      status: 'in_progress',
      sortBy: 'due_date',
      sortDirection: 'asc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(0);
  });

  it('should handle null descriptions correctly', async () => {
    // Insert test data
    await db.insert(tasksTable).values(testTasks).execute();

    const query: GetTasksQuery = {
      sortBy: 'title',
      sortDirection: 'asc'
    };

    const result = await getTasks(query);

    // Find the task with null description
    const taskWithNullDescription = result.find(task => task.title === 'Third Task');
    expect(taskWithNullDescription).toBeDefined();
    expect(taskWithNullDescription!.description).toBeNull();
  });

  it('should return tasks with all required fields', async () => {
    // Insert a single task
    await db.insert(tasksTable).values([testTasks[0]]).execute();

    const query: GetTasksQuery = {
      sortBy: 'due_date',
      sortDirection: 'asc'
    };

    const result = await getTasks(query);

    expect(result).toHaveLength(1);
    const task = result[0];

    // Verify all required fields are present
    expect(task.id).toBeDefined();
    expect(typeof task.id).toEqual('number');
    expect(task.title).toEqual('First Task');
    expect(task.description).toEqual('First task description');
    expect(task.due_date).toBeInstanceOf(Date);
    expect(task.status).toEqual('pending');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });
});
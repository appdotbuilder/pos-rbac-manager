import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (taskData: Partial<CreateTaskInput> = {}) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'A task for testing',
    due_date: new Date('2024-12-31'),
    status: 'pending' as const
  };

  const taskInput = { ...defaultTask, ...taskData };

  const result = await db.insert(tasksTable)
    .values({
      title: taskInput.title,
      description: taskInput.description,
      due_date: taskInput.due_date,
      status: taskInput.status
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a task with all fields', async () => {
    // Create initial task
    const initialTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      title: 'Updated Task Title',
      description: 'Updated description',
      due_date: new Date('2025-01-15'),
      status: 'in_progress'
    };

    const result = await updateTask(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(initialTask.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Updated description');
    expect(result.due_date).toEqual(new Date('2025-01-15'));
    expect(result.status).toEqual('in_progress');
    expect(result.created_at).toEqual(initialTask.created_at);
    expect(result.updated_at).not.toEqual(initialTask.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task with partial fields only', async () => {
    // Create initial task
    const initialTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description',
      status: 'pending'
    });

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      title: 'New Title',
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    // Verify only specified fields are updated
    expect(result.title).toEqual('New Title');
    expect(result.status).toEqual('completed');
    // These should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.due_date).toEqual(initialTask.due_date);
    expect(result.created_at).toEqual(initialTask.created_at);
    // This should be updated
    expect(result.updated_at).not.toEqual(initialTask.updated_at);
  });

  it('should update only the title field', async () => {
    const initialTask = await createTestTask();

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      title: 'Only Title Changed'
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Only Title Changed');
    expect(result.description).toEqual(initialTask.description);
    expect(result.due_date).toEqual(initialTask.due_date);
    expect(result.status).toEqual(initialTask.status);
    expect(result.created_at).toEqual(initialTask.created_at);
    expect(result.updated_at).not.toEqual(initialTask.updated_at);
  });

  it('should update description to null', async () => {
    const initialTask = await createTestTask({
      description: 'Initial description'
    });

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.title).toEqual(initialTask.title);
    expect(result.updated_at).not.toEqual(initialTask.updated_at);
  });

  it('should update due_date only', async () => {
    const initialTask = await createTestTask();
    const newDueDate = new Date('2025-06-15');

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      due_date: newDueDate
    };

    const result = await updateTask(updateInput);

    expect(result.due_date).toEqual(newDueDate);
    expect(result.title).toEqual(initialTask.title);
    expect(result.description).toEqual(initialTask.description);
    expect(result.status).toEqual(initialTask.status);
  });

  it('should update status only', async () => {
    const initialTask = await createTestTask({
      status: 'pending'
    });

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    expect(result.status).toEqual('completed');
    expect(result.title).toEqual(initialTask.title);
    expect(result.description).toEqual(initialTask.description);
    expect(result.due_date).toEqual(initialTask.due_date);
  });

  it('should save updated task to database', async () => {
    const initialTask = await createTestTask();

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      title: 'Database Updated Title',
      status: 'in_progress'
    };

    await updateTask(updateInput);

    // Verify the task was actually updated in the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, initialTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Updated Title');
    expect(tasks[0].status).toEqual('in_progress');
    expect(tasks[0].updated_at).not.toEqual(initialTask.updated_at);
  });

  it('should always update the updated_at timestamp', async () => {
    const initialTask = await createTestTask();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      title: 'Timestamp Test'
    };

    const result = await updateTask(updateInput);

    expect(result.updated_at).not.toEqual(initialTask.updated_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialTask.updated_at.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999, // Non-existent ID
      title: 'Should not work'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/task with id 999999 not found/i);
  });

  it('should preserve created_at timestamp', async () => {
    const initialTask = await createTestTask();

    const updateInput: UpdateTaskInput = {
      id: initialTask.id,
      title: 'Preserve Created At Test'
    };

    const result = await updateTask(updateInput);

    expect(result.created_at).toEqual(initialTask.created_at);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
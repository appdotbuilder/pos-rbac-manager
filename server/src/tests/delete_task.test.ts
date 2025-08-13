import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for creating a task to delete
const testTaskInput: CreateTaskInput = {
  title: 'Test Task to Delete',
  description: 'A task that will be deleted',
  due_date: new Date('2024-12-31'),
  status: 'pending'
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First, create a task to delete
    const createdTask = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        due_date: testTaskInput.due_date,
        status: testTaskInput.status
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    // Verify task exists before deletion
    const beforeDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(beforeDelete).toHaveLength(1);

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task no longer exists
    const afterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should throw error when deleting non-existent task', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteTaskInput = { id: nonExistentId };

    await expect(deleteTask(deleteInput))
      .rejects
      .toThrow(/task with id 99999 not found/i);
  });

  it('should delete task with null description', async () => {
    // Create task with null description
    const taskWithNullDescription = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        due_date: new Date('2024-12-31'),
        status: 'pending'
      })
      .returning()
      .execute();

    const taskId = taskWithNullDescription[0].id;

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify deletion
    const afterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should delete completed task', async () => {
    // Create a completed task
    const completedTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is completed',
        due_date: new Date('2024-01-01'),
        status: 'completed'
      })
      .returning()
      .execute();

    const taskId = completedTask[0].id;

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify deletion
    const afterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        due_date: new Date('2024-12-31'),
        status: 'pending'
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        due_date: new Date('2024-12-31'),
        status: 'in_progress'
      })
      .returning()
      .execute();

    const task3 = await db.insert(tasksTable)
      .values({
        title: 'Task 3',
        description: 'Third task',
        due_date: new Date('2024-12-31'),
        status: 'completed'
      })
      .returning()
      .execute();

    // Delete the middle task
    const deleteInput: DeleteTaskInput = { id: task2[0].id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify only task2 was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    const taskIds = remainingTasks.map(task => task.id);
    expect(taskIds).toContain(task1[0].id);
    expect(taskIds).toContain(task3[0].id);
    expect(taskIds).not.toContain(task2[0].id);
  });
});
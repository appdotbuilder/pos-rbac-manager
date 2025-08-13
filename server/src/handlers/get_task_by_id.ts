import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTaskById = async (id: number): Promise<Task | null> => {
  try {
    // Query for the task by ID
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, id))
      .execute();

    // Return the task if found, null if not found
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Get task by ID failed:', error);
    throw error;
  }
};
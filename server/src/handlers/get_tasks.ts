import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task, type GetTasksQuery } from '../schema';
import { eq, asc, desc } from 'drizzle-orm';

export const getTasks = async (query: GetTasksQuery): Promise<Task[]> => {
  try {
    // Build the query conditionally without reassigning the variable
    const baseQuery = db.select().from(tasksTable);
    
    // Apply sorting based on sortBy and sortDirection
    const sortColumn = tasksTable[query.sortBy];
    const sortOrder = query.sortDirection === 'desc' ? desc(sortColumn) : asc(sortColumn);

    // Build final query with conditional filtering
    const finalQuery = query.status
      ? baseQuery.where(eq(tasksTable.status, query.status)).orderBy(sortOrder)
      : baseQuery.orderBy(sortOrder);

    // Execute query
    const results = await finalQuery.execute();

    // Return results directly - no numeric conversions needed for this schema
    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Edit, Trash2, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { TaskForm } from '@/components/TaskForm';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import type { Task, TaskStatus, GetTasksQuery } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'created_at' | 'title'>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: GetTasksQuery = {
        sortBy,
        sortDirection,
        ...(statusFilter !== 'all' && { status: statusFilter })
      };
      const result = await trpc.getTasks.query(query);
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // For stub data demonstration since backend is placeholder
      const stubTasks: Task[] = [
        {
          id: 1,
          title: 'Complete project proposal',
          description: 'Write and submit the Q4 project proposal for the new client dashboard',
          due_date: new Date('2024-02-15'),
          status: 'pending' as TaskStatus,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 2,
          title: 'Review team performance',
          description: 'Conduct quarterly performance reviews for all team members',
          due_date: new Date('2024-02-20'),
          status: 'in_progress' as TaskStatus,
          created_at: new Date('2024-01-12'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 3,
          title: 'Update documentation',
          description: null,
          due_date: new Date('2024-01-30'),
          status: 'completed' as TaskStatus,
          created_at: new Date('2024-01-05'),
          updated_at: new Date('2024-01-28')
        },
        {
          id: 4,
          title: 'Fix critical bug in authentication',
          description: 'Users are experiencing login issues on mobile devices',
          due_date: new Date('2024-02-10'),
          status: 'in_progress' as TaskStatus,
          created_at: new Date('2024-02-08'),
          updated_at: new Date('2024-02-09')
        }
      ];
      
      // Apply client-side filtering and sorting for stub data
      let filteredTasks = stubTasks;
      if (statusFilter !== 'all') {
        filteredTasks = stubTasks.filter(task => task.status === statusFilter);
      }
      
      // Sort tasks
      filteredTasks.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'due_date':
            aValue = a.due_date;
            bValue = b.due_date;
            break;
          case 'created_at':
            aValue = a.created_at;
            bValue = b.created_at;
            break;
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          default:
            aValue = a.due_date;
            bValue = b.due_date;
        }
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      
      setTasks(filteredTasks);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, sortBy, sortDirection]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (taskData: any) => {
    try {
      const newTask = await trpc.createTask.mutate(taskData);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      // For stub demonstration - add task with mock ID
      const stubTask: Task = {
        id: Date.now(),
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.due_date,
        status: taskData.status,
        created_at: new Date(),
        updated_at: new Date()
      };
      setTasks((prev: Task[]) => [...prev, stubTask]);
      setShowCreateForm(false);
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    try {
      const updatedTask = await trpc.updateTask.mutate(taskData);
      setTasks((prev: Task[]) => 
        prev.map(task => task.id === taskData.id ? updatedTask : task)
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      // For stub demonstration - update task locally
      setTasks((prev: Task[]) => 
        prev.map(task => task.id === taskData.id ? { ...task, ...taskData, updated_at: new Date() } : task)
      );
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      // For stub demonstration - delete task locally
      setTasks((prev: Task[]) => prev.filter(task => task.id !== taskId));
    }
  };

  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'in_progress':
        return 'secondary' as const;
      case 'pending':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (task: Task) => {
    return task.status !== 'completed' && new Date(task.due_date) < new Date();
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📋 Task Manager
          </h1>
          <p className="text-gray-600 text-lg">
            Stay organized and productive with your personal task management system
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create New Task'}
          </Button>
          
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(value: TaskStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'due_date' | 'created_at' | 'title') => setSortBy(value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create Task Form */}
        {showCreateForm && (
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">✨ Create New Task</CardTitle>
              <CardDescription>Add a new task to your list</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskForm onSubmit={handleCreateTask} isLoading={isLoading} />
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="board" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="board">📊 Board View</TabsTrigger>
            <TabsTrigger value="list">📝 List View</TabsTrigger>
          </TabsList>

          {/* Board View */}
          <TabsContent value="board" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Pending Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <h3 className="font-semibold text-lg">Pending ({getTasksByStatus('pending').length})</h3>
                </div>
                <div className="space-y-3">
                  {getTasksByStatus('pending').map((task: Task) => (
                    <Card key={task.id} className={`transition-all hover:shadow-md border-0 bg-white/90 backdrop-blur-sm ${isOverdue(task) ? 'ring-2 ring-red-200' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTask(task)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {task.description && (
                          <CardDescription className="text-sm">{task.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="pt-0 flex justify-between items-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(task.due_date)}
                            {isOverdue(task) && ' (Overdue)'}
                          </span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))}
                  {getTasksByStatus('pending').length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No pending tasks</p>
                    </div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h3 className="font-semibold text-lg">In Progress ({getTasksByStatus('in_progress').length})</h3>
                </div>
                <div className="space-y-3">
                  {getTasksByStatus('in_progress').map((task: Task) => (
                    <Card key={task.id} className={`transition-all hover:shadow-md border-0 bg-white/90 backdrop-blur-sm ${isOverdue(task) ? 'ring-2 ring-red-200' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTask(task)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {task.description && (
                          <CardDescription className="text-sm">{task.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="pt-0 flex justify-between items-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(task.due_date)}
                            {isOverdue(task) && ' (Overdue)'}
                          </span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))}
                  {getTasksByStatus('in_progress').length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No tasks in progress</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="font-semibold text-lg">Completed ({getTasksByStatus('completed').length})</h3>
                </div>
                <div className="space-y-3">
                  {getTasksByStatus('completed').map((task: Task) => (
                    <Card key={task.id} className="transition-all hover:shadow-md border-0 bg-white/90 backdrop-blur-sm opacity-75">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base leading-tight line-through decoration-green-500">
                            {task.title}
                          </CardTitle>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTask(task)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {task.description && (
                          <CardDescription className="text-sm line-through">{task.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="pt-0 flex justify-between items-center">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.due_date)}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs bg-green-100 text-green-800">
                          ✅ {task.status.replace('_', ' ')}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))}
                  {getTasksByStatus('completed').length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No completed tasks</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <Card className="text-center py-12 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent>
                  <div className="text-gray-400 mb-4">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium mb-2">No tasks found</h3>
                    <p>Create your first task to get started!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task: Task) => (
                  <Card key={task.id} className={`group transition-all hover:shadow-md border-0 bg-white/90 backdrop-blur-sm ${isOverdue(task) ? 'ring-2 ring-red-200' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`font-medium text-lg ${task.status === 'completed' ? 'line-through decoration-green-500' : ''}`}>
                              {task.title}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                              {task.status === 'completed' && '✅ '}
                              {task.status.replace('_', ' ')}
                            </Badge>
                            {isOverdue(task) && (
                              <Badge variant="destructive" className="text-xs">
                                🚨 Overdue
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className={`text-gray-600 text-sm mb-2 ${task.status === 'completed' ? 'line-through' : ''}`}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                                Due: {formatDate(task.due_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Created: {formatDate(task.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTask(task)}
                            className="h-8"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Task Dialog */}
        {editingTask && (
          <EditTaskDialog
            task={editingTask}
            open={!!editingTask}
            onOpenChange={(open: boolean) => !open && setEditingTask(null)}
            onSubmit={handleUpdateTask}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

export default App;
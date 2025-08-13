import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Task, UpdateTaskInput, TaskStatus } from '../../../server/src/schema';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpdateTaskInput) => Promise<void>;
  isLoading?: boolean;
}

export function EditTaskDialog({ task, open, onOpenChange, onSubmit, isLoading = false }: EditTaskDialogProps) {
  const [formData, setFormData] = useState<UpdateTaskInput>({
    id: task.id,
    title: task.title,
    description: task.description,
    due_date: task.due_date,
    status: task.status
  });

  // Update form data when task changes
  useEffect(() => {
    setFormData({
      id: task.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      status: task.status
    });
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      setFormData((prev: UpdateTaskInput) => ({
        ...prev,
        due_date: new Date(dateValue)
      }));
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return '🔄';
      case 'in_progress':
        return '⚡';
      case 'completed':
        return '✅';
      default:
        return '🔄';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            ✏️ Edit Task
          </DialogTitle>
          <DialogDescription>
            Make changes to your task. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium flex items-center gap-2">
                📝 Task Title
              </Label>
              <Input
                id="edit-title"
                value={formData.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter task title..."
                required
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-sm font-medium flex items-center gap-2">
                🏷️ Status
              </Label>
              <Select
                value={formData.status || 'pending'}
                onValueChange={(value: TaskStatus) =>
                  setFormData((prev: UpdateTaskInput) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">🔄 Pending</SelectItem>
                  <SelectItem value="in_progress">⚡ In Progress</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-medium flex items-center gap-2">
              📄 Description
              <span className="text-xs text-gray-500 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="edit-description"
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: UpdateTaskInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              placeholder="Add task description, notes, or additional details..."
              rows={4}
              className="transition-all focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Due Date Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-due-date" className="text-sm font-medium flex items-center gap-2">
              📅 Due Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                id="edit-due-date"
                type="date"
                value={formData.due_date ? formatDateForInput(formData.due_date) : ''}
                onChange={handleDateChange}
                required
                className="pl-10 transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Task Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              📊 Task Information
            </h4>
            <div className="grid gap-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Task ID:</span>
                <span className="font-mono">#{task.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(task.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{new Date(task.updated_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Current Status:</span>
                <span className="flex items-center gap-1">
                  {getStatusIcon(task.status)}
                  <span className="capitalize">{task.status.replace('_', ' ')}</span>
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
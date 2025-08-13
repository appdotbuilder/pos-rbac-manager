import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import type { CreateTaskInput, TaskStatus } from '../../../server/src/schema';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    due_date: new Date(),
    status: 'pending'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      title: '',
      description: null,
      due_date: new Date(),
      status: 'pending'
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      setFormData((prev: CreateTaskInput) => ({
        ...prev,
        due_date: new Date(dateValue)
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
            📝 Task Title
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter task title..."
            required
            className="transition-all focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Field */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium flex items-center gap-2">
            🏷️ Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: TaskStatus) =>
              setFormData((prev: CreateTaskInput) => ({ ...prev, status: value }))
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
        <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
          📄 Description
          <span className="text-xs text-gray-500 font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateTaskInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          placeholder="Add task description, notes, or additional details..."
          rows={3}
          className="transition-all focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Due Date Field */}
      <div className="space-y-2">
        <Label htmlFor="due_date" className="text-sm font-medium flex items-center gap-2">
          📅 Due Date
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <Input
            id="due_date"
            type="date"
            value={formatDateForInput(formData.due_date)}
            onChange={handleDateChange}
            required
            className="pl-10 transition-all focus:ring-2 focus:ring-blue-500"
            min={formatDateForInput(new Date())} // Don't allow past dates for new tasks
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200 px-8"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Create Task
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
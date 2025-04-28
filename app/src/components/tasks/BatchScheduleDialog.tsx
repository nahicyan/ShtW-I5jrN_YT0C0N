import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Task } from '@/types/task';
import { taskService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { parseDateForInput } from '@/lib/utils';

interface BatchScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projectId: string;
}

const BatchScheduleDialog: React.FC<BatchScheduleDialogProps> = ({
  isOpen,
  onClose,
  tasks,
  projectId,
}) => {
  const queryClient = useQueryClient();
  const [shift, setShift] = useState<number>(0); // days to shift
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => 
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
  
  // Handle selecting/deselecting all tasks
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTasks(tasks.map(task => task._id));
    } else {
      setSelectedTasks([]);
    }
  };
  
  // Handle selecting/deselecting a single task
  const handleSelectTask = (taskId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };
  
  // Handle shift change
  const handleShiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setShift(isNaN(value) ? 0 : value);
  };
  
  // Apply schedule shift
  const applyScheduleShift = async () => {
    if (shift === 0 || selectedTasks.length === 0) return;
    
    const daysToShift = direction === 'forward' ? shift : -shift;
    
    // Update each selected task
    for (const taskId of selectedTasks) {
      const task = tasks.find(t => t._id === taskId);
      if (!task) continue;
      
      // Calculate new dates
      const startDate = new Date(task.startDate);
      startDate.setDate(startDate.getDate() + daysToShift);
      
      const endDate = new Date(task.endDate);
      endDate.setDate(endDate.getDate() + daysToShift);
      
      // Update the task
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    }
    
    // Close dialog after completion
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Batch Schedule Tasks</DialogTitle>
          <DialogDescription>
            Shift multiple task schedules at once by a specified number of days.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="shift-days">Shift by (days)</Label>
              <Input
                id="shift-days"
                type="number"
                min="0"
                value={shift}
                onChange={handleShiftChange}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <Label>Direction</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={direction === 'forward' ? 'default' : 'outline'}
                  onClick={() => setDirection('forward')}
                  className="flex-1"
                >
                  Forward
                </Button>
                <Button
                  type="button"
                  variant={direction === 'backward' ? 'default' : 'outline'}
                  onClick={() => setDirection('backward')}
                  className="flex-1"
                >
                  Backward
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md">
            <div className="flex items-center p-2 bg-muted border-b">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select-all"
                  className="h-4 w-4"
                  checked={selectedTasks.length === tasks.length}
                  onChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All Tasks
                </label>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {tasks.map(task => (
                <div 
                  key={task._id} 
                  className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`task-${task._id}`}
                      className="h-4 w-4"
                      checked={selectedTasks.includes(task._id)}
                      onChange={(e) => handleSelectTask(task._id, e.target.checked)}
                    />
                    <label htmlFor={`task-${task._id}`} className="font-medium">
                      {task.name}
                    </label>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Current: {parseDateForInput(task.startDate)} to {parseDateForInput(task.endDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Preview:</h4>
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks selected.</p>
            ) : (
              <p className="text-sm">
                {shift === 0 ? (
                  <span className="text-muted-foreground">No change. Enter a number of days to shift.</span>
                ) : (
                  <span>
                    {selectedTasks.length} task(s) will be shifted {shift} day(s) {direction}.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={applyScheduleShift}
            disabled={shift === 0 || selectedTasks.length === 0 || updateTaskMutation.isPending}
          >
            {updateTaskMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchScheduleDialog;
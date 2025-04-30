import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  Calendar,
  Save
} from 'lucide-react';
import TaskGanttChart from '@/components/tasks/TaskGanttChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { projectService, taskService } from '@/services/api';
import { formatCurrency, formatDate, parseDateForInput } from '@/lib/utils';
import { toast } from 'sonner';
import BatchScheduleDialog from '@/components/tasks/BatchScheduleDialog';

const Tasks: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBatchScheduleOpen, setIsBatchScheduleOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    projectId: projectId || '',
    startDate: '',
    endDate: '',
    estimatedBudget: 0,
    status: TaskStatus.NOT_STARTED,
    dependencies: [],
  });
  
  // Fetch project details
  const { 
    data: project, 
    isLoading: isLoadingProject,
    isError: isProjectError,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId || ''),
    enabled: !!projectId,
  });
  
  // Fetch tasks for this project
  const { 
    data: tasks, 
    isLoading: isLoadingTasks,
    isError: isTasksError,
  } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getTasksByProject(projectId || ''),
    enabled: !!projectId,
  });
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      // Set default dates based on project timeline
      const today = new Date();
      const startDateStr = project?.startDate ? 
        new Date(project.startDate) > today ? project.startDate : today.toISOString() :
        today.toISOString();
      
      const defaultEndDate = new Date(today);
      defaultEndDate.setDate(defaultEndDate.getDate() + 7); // Default to 1 week duration
      
      setFormData({
        name: '',
        description: '',
        projectId: projectId || '',
        startDate: parseDateForInput(startDateStr),
        endDate: parseDateForInput(defaultEndDate.toISOString()),
        estimatedBudget: 0,
        status: TaskStatus.NOT_STARTED,
        dependencies: [],
      });
    }
  }, [isAddDialogOpen, project, projectId]);
  
  // Load task data for editing
  useEffect(() => {
    if (editingTask) {
      setFormData({
        name: editingTask.name,
        description: editingTask.description || '',
        projectId: editingTask.projectId,
        startDate: parseDateForInput(editingTask.startDate),
        endDate: parseDateForInput(editingTask.endDate),
        estimatedBudget: editingTask.estimatedBudget || 0,
        status: editingTask.status,
        dependencies: editingTask.dependencies,
      });
      setIsAddDialogOpen(true);
    }
  }, [editingTask]);
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setIsAddDialogOpen(false);
      toast.success("Task created successfully");
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error("Failed to create task. Please try again.");
    },
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      console.log(`Updating task ${id}:`, data);
      return taskService.updateTask(id, data);
    },
    onMutate: (variables) => {
      // Optimistic update
      const { id, data } = variables;
      
      // Get current tasks from cache
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);
      
      // Optimistically update the cache
      if (previousTasks) {
        queryClient.setQueryData(['tasks', projectId], (old: Task[]) => 
          old.map(task => task._id === id ? { ...task, ...data } : task)
        );
      }
      
      return { previousTasks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setIsAddDialogOpen(false);
      setEditingTask(null);
      toast.success("Task updated successfully");
    },
    onError: (error, variables, context) => {
      console.error('Error updating task:', error);
      
      // Rollback to the previous state
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      
      toast.error("Failed to update task. Please try again.");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success("Task deleted successfully");
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error("Failed to delete task. Please try again.");
    },
  });
  
  // Handle form change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Handle select change
  const handleSelectChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle dependency selection
  const handleDependencyChange = (selectedIds: string[]) => {
    setFormData({
      ...formData,
      dependencies: selectedIds,
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      toast.error("Task name is required");
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      toast.error("Task dates are required");
      return;
    }
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate > endDate) {
      toast.error("End date must be after start date");
      return;
    }
    
    if (editingTask) {
      updateTaskMutation.mutate({
        id: editingTask._id,
        data: formData,
      });
    } else {
      createTaskMutation.mutate(formData);
    }
  };
  
  // Handle delete task
  const handleDeleteTask = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(id);
    }
  };
  
  // Task date update handler
  const handleTaskDateUpdate = (taskId: string, startDate: Date, endDate: Date) => {
    console.log(`Task date update for ${taskId}:`, { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
    
    // Add validation to prevent invalid dates
    if (!startDate || !endDate) {
      console.error("Invalid dates:", { startDate, endDate });
      toast.error("Invalid dates detected");
      return;
    }
    
    if (startDate > endDate) {
      console.error("Start date after end date:", { startDate, endDate });
      toast.error("Start date cannot be after end date");
      return;
    }
    
    // Check if this is actually a change
    const task = tasks?.find(t => t._id === taskId);
    if (task) {
      const currentStart = new Date(task.startDate).getTime();
      const currentEnd = new Date(task.endDate).getTime();
      const newStart = startDate.getTime();
      const newEnd = endDate.getTime();
      
      if (currentStart === newStart && currentEnd === newEnd) {
        console.log("No change in dates, skipping update");
        return;
      }
    }
    
    // Update the task
    updateTaskMutation.mutate({
      id: taskId,
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }
    });
  };

  // Handle dependency add between tasks
  const handleDependencyAdd = (sourceId: string, targetId: string, type: string) => {
    console.log(`Adding dependency: ${sourceId} → ${targetId} (${type})`);
    
    // Find the target task to update its dependencies
    const targetTask = tasks?.find(t => t._id === targetId);
    if (!targetTask) {
      console.error("Target task not found:", targetId);
      toast.error("Failed to add dependency: Target task not found");
      return;
    }
    
    // Check if dependency already exists
    if (targetTask.dependencies.includes(sourceId)) {
      console.log("Dependency already exists");
      return;
    }
    
    // Add the source task as a dependency
    const updatedDependencies = [...targetTask.dependencies, sourceId];
    
    updateTaskMutation.mutate({
      id: targetId,
      data: {
        dependencies: updatedDependencies
      }
    });
  };

  // Handle dependency remove between tasks
  const handleDependencyRemove = (sourceId: string, targetId: string) => {
    console.log(`Removing dependency: ${sourceId} → ${targetId}`);
    
    // Find the target task to update its dependencies
    const targetTask = tasks?.find(t => t._id === targetId);
    if (!targetTask) {
      console.error("Target task not found:", targetId);
      toast.error("Failed to remove dependency: Target task not found");
      return;
    }
    
    // Remove the source task from dependencies
    const updatedDependencies = targetTask.dependencies.filter(id => id !== sourceId);
    
    updateTaskMutation.mutate({
      id: targetId,
      data: {
        dependencies: updatedDependencies
      }
    });
  };
  
  // Reset dialog state
  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingTask(null);
    setFormData({
      name: '',
      description: '',
      projectId: projectId || '',
      startDate: '',
      endDate: '',
      estimatedBudget: 0,
      status: TaskStatus.NOT_STARTED,
      dependencies: [],
    });
  };
  
  if (isLoadingProject || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }
  
  if (isProjectError || isTasksError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading data. Please try again.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="bg-muted p-8 rounded-lg text-center">
        <p className="text-muted-foreground mb-4">Project not found.</p>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Tasks for {project.name}</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsBatchScheduleOpen(true)} 
            disabled={!tasks || tasks.length === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Batch Schedule
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>
      
      {/* Task List with List & Gantt tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="gantt">Gantt View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {!tasks || tasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-6">
                  <p className="text-muted-foreground mb-4">No tasks found for this project.</p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>Create First Task</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Project Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dependencies</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>
                          {formatDate(task.startDate)} - {formatDate(task.endDate)}
                          {task.duration && <div className="text-xs text-muted-foreground">{task.duration} days</div>}
                        </TableCell>
                        <TableCell>{formatCurrency(task.estimatedBudget)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === TaskStatus.COMPLETED 
                              ? 'bg-green-100 text-green-800' 
                              : task.status === TaskStatus.IN_PROGRESS 
                              ? 'bg-blue-100 text-blue-800' 
                              : task.status === TaskStatus.ON_HOLD 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.dependencies.length > 0 ? (
                            <div>
                              {task.dependencies.map(depId => {
                                const depTask = tasks.find(t => t._id === depId);
                                return depTask ? (
                                  <div key={depId} className="text-xs">• {depTask.name}</div>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingTask(task)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive" 
                              onClick={() => handleDeleteTask(task._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gantt">
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent className="h-[600px]">
              {tasks && tasks.length > 0 ? (
                <TaskGanttChart
                  tasks={tasks}
                  onTaskUpdate={handleTaskDateUpdate}
                  onDependencyAdd={handleDependencyAdd}
                  onDependencyRemove={handleDependencyRemove}
                  projectStartDate={project.startDate}
                  projectEndDate={project.estimatedEndDate}
                />
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  No tasks found for this project.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter task name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedBudget">Estimated Budget ($)</Label>
                  <Input
                    id="estimatedBudget"
                    name="estimatedBudget"
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={handleChange}
                    min={0}
                    step={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {tasks && tasks.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="dependencies">Dependencies</Label>
                  <Select 
                    value={formData.dependencies.length > 0 ? "has-values" : ""} 
                    onValueChange={() => {}}
                  >
                    <SelectTrigger id="dependencies">
                      <SelectValue placeholder="Select dependencies" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks
                        .filter(t => !editingTask || t._id !== editingTask._id)
                        .map((task) => (
                          <div key={task._id} className="flex items-center px-2 py-1">
                            <input
                              type="checkbox"
                              id={`dep-${task._id}`}
                              className="mr-2"
                              checked={formData.dependencies.includes(task._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleDependencyChange([...formData.dependencies, task._id]);
                                } else {
                                  handleDependencyChange(formData.dependencies.filter(id => id !== task._id));
                                }
                              }}
                            />
                            <label htmlFor={`dep-${task._id}`} className="text-sm">
                              {task.name}
                            </label>
                          </div>
                        ))}
                    </SelectContent>
                  </Select>
                  {formData.dependencies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.dependencies.map(depId => {
                        const depTask = tasks.find(t => t._id === depId);
                        return depTask ? (
                          <div 
                            key={depId} 
                            className="bg-muted px-2 py-1 rounded-md text-xs flex items-center gap-1"
                          >
                            {depTask.name}
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDependencyChange(formData.dependencies.filter(id => id !== depId))}
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending}>
                {(createTaskMutation.isPending || updateTaskMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Batch Schedule Dialog */}
      {tasks && projectId && (
        <BatchScheduleDialog
          isOpen={isBatchScheduleOpen}
          onClose={() => setIsBatchScheduleOpen(false)}
          tasks={tasks}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default Tasks;
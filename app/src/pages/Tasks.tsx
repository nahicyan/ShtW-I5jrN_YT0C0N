import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import BatchScheduleDialog from '@/components/tasks/BatchScheduleDialog';
import WXGanttChart from '@/components/tasks/WXGanttChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Task, TaskStatus, TaskFormData } from '@/types/task';
import { Project } from '@/types/project';
import { taskService, projectService } from '@/services/api';
import { formatCurrency, formatDate, parseDateForInput } from '@/lib/utils';

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
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> }) => 
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setEditingTask(null);
      resetForm();
    },
  });

  const handleTaskDateUpdate = (taskId: string, startDate: Date, endDate: Date) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  };
  
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
  
  // Reset form data
  const resetForm = useCallback(() => {
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
  }, [projectId]);
  
  // Initialize form data when editing a task
  useEffect(() => {
    if (editingTask) {
      setFormData({
        name: editingTask.name,
        description: editingTask.description || '',
        projectId: editingTask.projectId,
        startDate: parseDateForInput(editingTask.startDate),
        endDate: parseDateForInput(editingTask.endDate),
        actualStartDate: editingTask.actualStartDate ? parseDateForInput(editingTask.actualStartDate) : undefined,
        actualEndDate: editingTask.actualEndDate ? parseDateForInput(editingTask.actualEndDate) : undefined,
        estimatedBudget: editingTask.estimatedBudget,
        actualCost: editingTask.actualCost,
        status: editingTask.status,
        dependencies: editingTask.dependencies,
      });
    }
  }, [editingTask]);
  
  // Form change handler
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
  
  // Select change handler
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Dependencies change handler
  const handleDependencyChange = (taskId: string, isChecked: boolean) => {
    if (isChecked) {
      setFormData({
        ...formData,
        dependencies: [...formData.dependencies, taskId],
      });
    } else {
      setFormData({
        ...formData,
        dependencies: formData.dependencies.filter(id => id !== taskId),
      });
    }
  };
  
  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask._id, data: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };
  
  // Delete handler
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(id);
    }
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditingTask(null);
    resetForm();
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
            <Button variant="outline" onClick={() => setIsBatchScheduleOpen(true)} disabled={!tasks || tasks.length === 0}>
              <Calendar className="h-4 w-4 mr-2" />
              Batch Schedule
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <span style={{ display: 'none' }}></span>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
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
                
                <div className="space-y-2">
                  <Label htmlFor="estimatedBudget">Estimated Budget ($)</Label>
                  <Input
                    id="estimatedBudget"
                    name="estimatedBudget"
                    type="number"
                    value={formData.estimatedBudget || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actualCost">Actual Cost ($)</Label>
                  <Input
                    id="actualCost"
                    name="actualCost"
                    type="number"
                    value={formData.actualCost || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                />
              </div>
              
              {tasks && tasks.length > 0 && (
                <div className="space-y-2">
                  <Label>Dependencies</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {tasks
                        .filter(task => !editingTask || task._id !== editingTask._id)
                        .map(task => (
                          <div key={task._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`dep-${task._id}`}
                              checked={formData.dependencies.includes(task._id)}
                              onChange={(e) => handleDependencyChange(task._id, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label htmlFor={`dep-${task._id}`} className="text-sm">
                              {task.name}
                            </label>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Task List */}
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
                          onClick={() => handleDelete(task._id)}
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
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <WXGanttChart
                tasks={tasks || []}
                onTaskUpdate={handleTaskDateUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      
      {/* Batch Schedule Dialog */}
      {tasks && projectId && (
        <BatchScheduleDialog
          isOpen={isBatchScheduleOpen}
          onClose={() => setIsBatchScheduleOpen(false)}
          tasks={tasks}
          projectId={projectId}
        />
      )}
      
      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Task Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-actualStartDate">Actual Start Date</Label>
                  <Input
                    id="edit-actualStartDate"
                    name="actualStartDate"
                    type="date"
                    value={formData.actualStartDate || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-actualEndDate">Actual End Date</Label>
                  <Input
                    id="edit-actualEndDate"
                    name="actualEndDate"
                    type="date"
                    value={formData.actualEndDate || ''}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-estimatedBudget">Estimated Budget ($)</Label>
                  <Input
                    id="edit-estimatedBudget"
                    name="estimatedBudget"
                    type="number"
                    value={formData.estimatedBudget || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-actualCost">Actual Cost ($)</Label>
                  <Input
                    id="edit-actualCost"
                    name="actualCost"
                    type="number"
                    value={formData.actualCost || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                />
              </div>
              
              {tasks && tasks.length > 1 && (
                <div className="space-y-2">
                  <Label>Dependencies</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {tasks
                        .filter(task => task._id !== editingTask._id)
                        .map(task => (
                          <div key={task._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`edit-dep-${task._id}`}
                              checked={formData.dependencies.includes(task._id)}
                              onChange={(e) => handleDependencyChange(task._id, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label htmlFor={`edit-dep-${task._id}`} className="text-sm">
                              {task.name}
                            </label>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Tasks;
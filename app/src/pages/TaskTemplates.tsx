import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskTemplate, TaskTemplateFormData } from '@/types/taskTemplate';
import { Question } from '@/types/questionnaire';
import { taskTemplateService, questionService } from '@/services/api';
import TaskTemplateForm from '@/components/taskTemplates/TaskTemplateForm';
import TaskTemplateList from '@/components/taskTemplates/TaskTemplateList';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, AlertTriangle } from 'lucide-react';

const TaskTemplates: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTaskTemplate, setEditingTaskTemplate] = useState<TaskTemplate | null>(null);
  
  // Fetch task templates
  const { 
    data: taskTemplates, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['taskTemplates'],
    queryFn: taskTemplateService.getTaskTemplates,
  });
  
  // Fetch questions for condition selectors
  const { 
    data: questions 
  } = useQuery({
    queryKey: ['questions'],
    queryFn: questionService.getQuestions,
  });
  
  // Create task template mutation
  const createTaskTemplateMutation = useMutation({
    mutationFn: (data: TaskTemplateFormData) => taskTemplateService.createTaskTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] });
      setIsAddDialogOpen(false);
      toast.success('Task template created successfully');
    },
    onError: (error) => {
      console.error('Error creating task template:', error);
      toast.error('Failed to create task template');
    },
  });
  
  // Update task template mutation
  const updateTaskTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskTemplateFormData }) => 
      taskTemplateService.updateTaskTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] });
      setEditingTaskTemplate(null);
      toast.success('Task template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating task template:', error);
      toast.error('Failed to update task template');
    },
  });
  
  // Delete task template mutation
  const deleteTaskTemplateMutation = useMutation({
    mutationFn: (id: string) => taskTemplateService.deleteTaskTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] });
      toast.success('Task template deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting task template:', error);
      toast.error('Failed to delete task template');
    },
  });
  
  const handleCreateTaskTemplate = (data: TaskTemplateFormData) => {
    createTaskTemplateMutation.mutate(data);
  };
  
  const handleUpdateTaskTemplate = (data: TaskTemplateFormData) => {
    if (editingTaskTemplate) {
      updateTaskTemplateMutation.mutate({ id: editingTaskTemplate._id, data });
    }
  };
  
  const handleDeleteTaskTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task template?')) {
      deleteTaskTemplateMutation.mutate(id);
    }
  };
  
  const handleEditTaskTemplate = (taskTemplate: TaskTemplate) => {
    setEditingTaskTemplate(taskTemplate);
  };
  
  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingTaskTemplate(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading task templates...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading task templates. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Task Templates</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Task Template
        </Button>
      </div>
      
      <TaskTemplateList
        taskTemplates={taskTemplates || []}
        onEditTaskTemplate={handleEditTaskTemplate}
        onDeleteTaskTemplate={handleDeleteTaskTemplate}
        onAddTaskTemplate={() => setIsAddDialogOpen(true)}
      />
      
      {/* Create/Edit Task Template Dialog */}
      <Dialog 
        open={isAddDialogOpen || !!editingTaskTemplate} 
        onOpenChange={handleCloseDialog}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTaskTemplate ? 'Edit Task Template' : 'Create Task Template'}</DialogTitle>
          </DialogHeader>
          <TaskTemplateForm
            initialData={editingTaskTemplate || undefined}
            availableTaskTemplates={taskTemplates || []}
            questions={questions || []}
            onSubmit={editingTaskTemplate ? handleUpdateTaskTemplate : handleCreateTaskTemplate}
            onCancel={handleCloseDialog}
            isSubmitting={createTaskTemplateMutation.isPending || updateTaskTemplateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskTemplates;
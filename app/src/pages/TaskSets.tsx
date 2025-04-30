import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskSet, TaskSetFormData } from '@/types/taskSet';
import { TaskTemplate } from '@/types/taskTemplate';
import { taskSetService, taskTemplateService } from '@/services/api';
import TaskSetForm from '@/components/taskSets/TaskSetForm';
import TaskSetList from '@/components/taskSets/TaskSetList';
import TaskTemplateList from '@/components/taskTemplates/TaskTemplateList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  AlertTriangle, 
  Search, 
  X,
  MoveUp,
  MoveDown
} from 'lucide-react';

const TaskSets: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTaskSet, setEditingTaskSet] = useState<TaskSet | null>(null);
  const [viewingTaskSet, setViewingTaskSet] = useState<TaskSet | null>(null);
  const [isAddingTemplates, setIsAddingTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch task sets
  const { 
    data: taskSets, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['taskSets'],
    queryFn: taskSetService.getTaskSets,
  });
  
  // Fetch detailed task set when viewing
  const { 
    data: detailedTaskSet,
    isLoading: isLoadingDetails,
    isError: isDetailsError
  } = useQuery({
    queryKey: ['taskSet', viewingTaskSet?._id],
    queryFn: () => taskSetService.getTaskSet(viewingTaskSet?._id || ''),
    enabled: !!viewingTaskSet,
  });

  // Fetch all task templates for adding to task set
  const {
    data: allTaskTemplates,
    isLoading: isLoadingTemplates,
  } = useQuery({
    queryKey: ['taskTemplates'],
    queryFn: taskTemplateService.getTaskTemplates,
    enabled: isAddingTemplates,
  });
  
  // Create task set mutation
  const createTaskSetMutation = useMutation({
    mutationFn: (data: TaskSetFormData) => taskSetService.createTaskSet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSets'] });
      setIsAddDialogOpen(false);
      toast.success('Task set created successfully');
    },
    onError: (error) => {
      console.error('Error creating task set:', error);
      toast.error('Failed to create task set');
    },
  });
  
  // Update task set mutation
  const updateTaskSetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskSetFormData }) => 
      taskSetService.updateTaskSet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSets'] });
      setEditingTaskSet(null);
      toast.success('Task set updated successfully');
    },
    onError: (error) => {
      console.error('Error updating task set:', error);
      toast.error('Failed to update task set');
    },
  });
  
  // Delete task set mutation
  const deleteTaskSetMutation = useMutation({
    mutationFn: (id: string) => taskSetService.deleteTaskSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSets'] });
      toast.success('Task set deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting task set:', error);
      toast.error('Failed to delete task set');
    },
  });
  
  // Update task template order mutation
  const updateTemplateOrderMutation = useMutation({
    mutationFn: ({ taskSetId, taskTemplates }: { taskSetId: string; taskTemplates: string[] }) => 
      taskSetService.updateTaskTemplateOrder(taskSetId, taskTemplates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskSet', variables.taskSetId] });
      toast.success('Template order updated');
    },
    onError: (error) => {
      console.error('Error updating template order:', error);
      toast.error('Failed to update template order');
    },
  });
  
  // Add template to task set mutation
  const addTemplateMutation = useMutation({
    mutationFn: ({ taskSetId, templateId }: { taskSetId: string; templateId: string }) => 
      taskSetService.addTaskTemplateToTaskSet(taskSetId, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskSet', variables.taskSetId] });
      toast.success('Template added to task set');
    },
    onError: (error) => {
      console.error('Error adding template:', error);
      toast.error('Failed to add template');
    },
  });

  // Remove template from task set mutation
  const removeTemplateMutation = useMutation({
    mutationFn: ({ taskSetId, templateId }: { taskSetId: string; templateId: string }) => 
      taskSetService.removeTaskTemplateFromTaskSet(taskSetId, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taskSet', variables.taskSetId] });
      toast.success('Template removed from task set');
    },
    onError: (error) => {
      console.error('Error removing template:', error);
      toast.error('Failed to remove template');
    },
  });
  
  const handleCreateTaskSet = (data: TaskSetFormData) => {
    createTaskSetMutation.mutate(data);
  };
  
  const handleUpdateTaskSet = (data: TaskSetFormData) => {
    if (editingTaskSet) {
      updateTaskSetMutation.mutate({ id: editingTaskSet._id, data });
    }
  };
  
  const handleDeleteTaskSet = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task set?')) {
      deleteTaskSetMutation.mutate(id);
    }
  };
  
  const handleEditTaskSet = (taskSet: TaskSet) => {
    setEditingTaskSet(taskSet);
  };
  
  const handleViewTaskSet = (taskSet: TaskSet) => {
    setViewingTaskSet(taskSet);
    setIsAddingTemplates(false);
    setSearchTerm('');
  };
  
  const handleMoveTemplate = (templateId: string, direction: 'up' | 'down') => {
    if (!detailedTaskSet) return;
    
    const templates = detailedTaskSet.taskTemplates;
    const templateIds = templates.map(t => typeof t === 'string' ? t : t._id);
    const currentIndex = templateIds.indexOf(templateId);
    
    if (currentIndex === -1) return;
    
    const newTemplateIds = [...templateIds];
    
    if (direction === 'up' && currentIndex > 0) {
      // Swap with the previous item
      [newTemplateIds[currentIndex], newTemplateIds[currentIndex - 1]] = 
      [newTemplateIds[currentIndex - 1], newTemplateIds[currentIndex]];
    } else if (direction === 'down' && currentIndex < templateIds.length - 1) {
      // Swap with the next item
      [newTemplateIds[currentIndex], newTemplateIds[currentIndex + 1]] = 
      [newTemplateIds[currentIndex + 1], newTemplateIds[currentIndex]];
    } else {
      return; // No change needed
    }
    
    updateTemplateOrderMutation.mutate({
      taskSetId: detailedTaskSet._id,
      taskTemplates: newTemplateIds,
    });
  };
  
  const handleRemoveTemplate = (templateId: string) => {
    if (!viewingTaskSet) return;
    
    if (window.confirm('Are you sure you want to remove this template from the task set?')) {
      removeTemplateMutation.mutate({
        taskSetId: viewingTaskSet._id,
        templateId,
      });
    }
  };

  const handleAddTemplate = (templateId: string) => {
    if (!viewingTaskSet) return;
    
    addTemplateMutation.mutate({
      taskSetId: viewingTaskSet._id,
      templateId,
    });
  };

  const toggleAddTemplates = () => {
    setIsAddingTemplates(!isAddingTemplates);
    setSearchTerm('');
  };

  // Filter available templates based on search term
  const filteredTemplates = allTaskTemplates?.filter(template => {
    // Filter out templates that are already in the task set
    const isAlreadyAdded = detailedTaskSet?.taskTemplates.some(t => {
      return typeof t === 'string' 
        ? t === template._id 
        : t._id === template._id;
    });
    
    // Filter by search term
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return !isAlreadyAdded && matchesSearch;
  });
  
  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingTaskSet(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading task sets...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading task sets. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Task Sets</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Task Set
        </Button>
      </div>
      
      <TaskSetList
        taskSets={taskSets || []}
        onEditTaskSet={handleEditTaskSet}
        onDeleteTaskSet={handleDeleteTaskSet}
        onViewTaskSet={handleViewTaskSet}
        onAddTaskSet={() => setIsAddDialogOpen(true)}
      />
      
      {/* Create/Edit Task Set Dialog */}
      <Dialog 
        open={isAddDialogOpen || !!editingTaskSet} 
        onOpenChange={handleCloseDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTaskSet ? 'Edit Task Set' : 'Create Task Set'}</DialogTitle>
          </DialogHeader>
          <TaskSetForm
            initialData={editingTaskSet || undefined}
            onSubmit={editingTaskSet ? handleUpdateTaskSet : handleCreateTaskSet}
            onCancel={handleCloseDialog}
            isSubmitting={createTaskSetMutation.isPending || updateTaskSetMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Task Set Dialog */}
      <Dialog 
        open={!!viewingTaskSet} 
        onOpenChange={(open) => {
          if (!open) {
            setViewingTaskSet(null);
            setIsAddingTemplates(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex-1">
              {viewingTaskSet?.name} - Templates
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant={isAddingTemplates ? "default" : "outline"} 
                onClick={toggleAddTemplates}
              >
                {isAddingTemplates ? 'Cancel' : 'Add Templates'}
              </Button>
            </div>
          </DialogHeader>
          
          {/* Templates List */}
          {isLoadingDetails ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : isDetailsError ? (
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              <span>Error loading templates. Please try again.</span>
            </div>
          ) : (
            <div className="py-4">
              {detailedTaskSet && (
                <>
                  {/* Current Templates */}
                  {Array.isArray(detailedTaskSet.taskTemplates) && detailedTaskSet.taskTemplates.length > 0 ? (
                    <div className="space-y-4">
                      {detailedTaskSet.taskTemplates.map((template, index) => {
                        const templateObj = typeof template === 'string' ? 
                          {_id: template, name: `Template ${index + 1}`} : 
                          template as TaskTemplate;
                        
                        return (
                          <div key={templateObj._id} className="flex items-center justify-between p-4 border rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col space-y-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleMoveTemplate(templateObj._id, 'up')}
                                  disabled={index === 0}
                                >
                                  <MoveUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleMoveTemplate(templateObj._id, 'down')}
                                  disabled={index === detailedTaskSet.taskTemplates.length - 1}
                                >
                                  <MoveDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <div>
                                <div className="font-medium">{templateObj.name}</div>
                                {typeof template !== 'string' && template.description && (
                                  <div className="text-sm text-muted-foreground">{template.description}</div>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveTemplate(templateObj._id)}
                              className="text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-muted rounded-md">
                      <p className="text-muted-foreground mb-4">This task set has no templates.</p>
                      <Button onClick={toggleAddTemplates}>
                        <Plus className="h-4 w-4 mr-2" /> Add Templates
                      </Button>
                    </div>
                  )}
                  
                  {/* Add Templates Panel */}
                  {isAddingTemplates && (
                    <div className="mt-4 p-4 border rounded-md">
                      <h3 className="text-lg font-medium mb-4">Add Templates</h3>
                      
                      <div className="relative mb-4">
                        <Input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search templates..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {searchTerm ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSearchTerm('')}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Search className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      {isLoadingTemplates ? (
                        <div className="flex justify-center items-center h-20">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="ml-2">Loading available templates...</span>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                          {filteredTemplates && filteredTemplates.length > 0 ? (
                            filteredTemplates.map(template => (
                              <div key={template._id} className="flex justify-between items-center p-3 hover:bg-muted">
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  {template.description && (
                                    <div className="text-sm text-muted-foreground">{template.description}</div>
                                  )}
                                </div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddTemplate(template._id)}
                                  className="ml-2"
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              {searchTerm ? 'No matching templates found.' : 'No available templates. Create some first!'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setViewingTaskSet(null);
                setIsAddingTemplates(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskSets;
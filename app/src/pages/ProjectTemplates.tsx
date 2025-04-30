// app/src/pages/ProjectTemplates.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectTemplate, ProjectTemplateFormData } from '@/types/projectTemplate';
import { projectTemplateService, questionnaireService, taskSetService } from '@/services/api';
import ProjectTemplateList from '@/components/projectTemplates/ProjectTemplateList';
import ProjectTemplateForm from '@/components/projectTemplates/ProjectTemplateForm';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, AlertTriangle } from 'lucide-react';

const ProjectTemplates: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<ProjectTemplate | null>(null);
  
  // Fetch project templates
  const { 
    data: projectTemplates, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: projectTemplateService.getProjectTemplates,
  });
  
  // Fetch detailed project template when viewing
  const { 
    data: detailedTemplate,
    isLoading: isLoadingDetails,
    isError: isDetailsError
  } = useQuery({
    queryKey: ['projectTemplate', viewingTemplate?._id],
    queryFn: () => projectTemplateService.getProjectTemplate(viewingTemplate?._id || ''),
    enabled: !!viewingTemplate,
  });

  // Fetch questionnaires for select dropdown
  const {
    data: questionnaires,
    isLoading: isLoadingQuestionnaires
  } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: questionnaireService.getQuestionnaires,
  });

  // Fetch task sets for select dropdown
  const {
    data: taskSets,
    isLoading: isLoadingTaskSets
  } = useQuery({
    queryKey: ['taskSets'],
    queryFn: taskSetService.getTaskSets,
  });
  
  // Create project template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: ProjectTemplateFormData) => projectTemplateService.createProjectTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      setIsAddDialogOpen(false);
      toast.success('Project template created successfully');
    },
    onError: (error) => {
      console.error('Error creating project template:', error);
      toast.error('Failed to create project template');
    },
  });
  
  // Update project template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectTemplateFormData }) => 
      projectTemplateService.updateProjectTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      setEditingTemplate(null);
      toast.success('Project template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating project template:', error);
      toast.error('Failed to update project template');
    },
  });
  
  // Delete project template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => projectTemplateService.deleteProjectTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
      toast.success('Project template deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting project template:', error);
      toast.error('Failed to delete project template');
    },
  });
  
  const handleCreateTemplate = (data: ProjectTemplateFormData) => {
    createTemplateMutation.mutate(data);
  };
  
  const handleUpdateTemplate = (data: ProjectTemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate._id, data });
    }
  };
  
  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };
  
  const handleEditTemplate = (template: ProjectTemplate) => {
    setEditingTemplate(template);
  };

  const handleViewTemplate = (template: ProjectTemplate) => {
    setViewingTemplate(template);
  };
  
  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingTemplate(null);
  };
  
  if (isLoading || isLoadingQuestionnaires || isLoadingTaskSets) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading project templates...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading project templates. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Project Templates</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Project Template
        </Button>
      </div>
      
      <ProjectTemplateList
        projectTemplates={projectTemplates || []}
        onEditProjectTemplate={handleEditTemplate}
        onDeleteProjectTemplate={handleDeleteTemplate}
        onViewProjectTemplate={handleViewTemplate}
        onAddProjectTemplate={() => setIsAddDialogOpen(true)}
      />
      
      {/* Create/Edit Project Template Dialog */}
      <Dialog 
        open={isAddDialogOpen || !!editingTemplate} 
        onOpenChange={handleCloseDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Project Template' : 'Create Project Template'}</DialogTitle>
          </DialogHeader>
          <ProjectTemplateForm
            initialData={editingTemplate || undefined}
            questionnaires={questionnaires || []}
            taskSets={taskSets || []}
            onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
            onCancel={handleCloseDialog}
            isSubmitting={createTemplateMutation.isPending || updateTemplateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Project Template Dialog */}
      <Dialog 
        open={!!viewingTemplate} 
        onOpenChange={(open) => {
          if (!open) {
            setViewingTemplate(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Project Template Details
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading template details...</span>
            </div>
          ) : isDetailsError ? (
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              <span>Error loading template details. Please try again.</span>
            </div>
          ) : detailedTemplate && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{detailedTemplate.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {detailedTemplate.description && (
                    <p className="text-muted-foreground mb-4">{detailedTemplate.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Questionnaire</h3>
                      <div className="p-3 bg-muted rounded-md">
                        {typeof detailedTemplate.questionnaireId === 'string' ? (
                          <p className="text-muted-foreground">Questionnaire not loaded</p>
                        ) : (
                          <>
                            <p className="font-medium">{detailedTemplate.questionnaireId.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {detailedTemplate.questionnaireId.questions.length} questions
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Task Set</h3>
                      <div className="p-3 bg-muted rounded-md">
                        {typeof detailedTemplate.taskSetId === 'string' ? (
                          <p className="text-muted-foreground">Task set not loaded</p>
                        ) : (
                          <>
                            <p className="font-medium">{detailedTemplate.taskSetId.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {detailedTemplate.taskSetId.taskTemplates.length} templates
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setViewingTemplate(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectTemplates;
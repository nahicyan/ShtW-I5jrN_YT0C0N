import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import { projectService, taskService } from '@/services/api';
import { Project, ProjectStatus } from '@/types/project';
import WXGanttChart from '@/components/tasks/WXGanttChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';

const Schedule: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const queryClient = useQueryClient();
  
  // Fetch all projects
  const { 
    data: projects, 
    isLoading: isLoadingProjects,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });
  
  // Fetch tasks for selected project or all active projects
  const { 
    data: tasks, 
    isLoading: isLoadingTasks,
    isError: isTasksError,
  } = useQuery({
    queryKey: ['tasks', selectedProject],
    queryFn: async () => {
      if (selectedProject === 'all') {
        // Get tasks for all active projects
        const activeProjects = projects?.filter(p => 
          p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.PLANNING
        );
        
        if (!activeProjects || activeProjects.length === 0) return [];
        
        // Fetch tasks for each project
        const allTasks = await Promise.all(
          activeProjects.map(project => 
            taskService.getTasksByProject(project._id)
          )
        );
        
        // Flatten the array of task arrays
        return allTasks.flat();
      } else {
        // Get tasks for selected project
        return taskService.getTasksByProject(selectedProject);
      }
    },
    enabled: !!projects,
  });
  
  // Get project details for selected project
  const selectedProjectDetails = selectedProject !== 'all'
    ? projects?.find(p => p._id === selectedProject)
    : undefined;

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProject] });
    },
  });

  // Task update handler for drag/resize operations
  const handleTaskDateUpdate = (taskId: string, startDate: Date, endDate: Date) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  };

  // Handle dependency/link creation
  const handleLinkCreate = (sourceId: string, targetId: string, type: string) => {
    // Find the target task
    const targetTask = tasks?.find(t => t._id === targetId);
    
    if (targetTask) {
      // Check if this dependency already exists
      if (!targetTask.dependencies?.includes(sourceId)) {
        // Update the task with the new dependency
        updateTaskMutation.mutate({
          id: targetId,
          data: {
            dependencies: [...(targetTask.dependencies || []), sourceId]
          }
        });
      }
    }
  };

  // Handle dependency/link deletion
  const handleLinkDelete = (linkId: string) => {
    // Parse the linkId to get source and target
    const [sourceId, targetId] = linkId.split('-');
    
    // Find the target task
    const targetTask = tasks?.find(t => t._id === targetId);
    
    if (targetTask && targetTask.dependencies) {
      // Update the task by removing the dependency
      updateTaskMutation.mutate({
        id: targetId,
        data: {
          dependencies: targetTask.dependencies.filter(id => id !== sourceId)
        }
      });
    }
  };
  
  if (isLoadingProjects || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading schedule data...</span>
      </div>
    );
  }
  
  if (isProjectsError || isTasksError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <p>Error loading data. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="projectSelect">Select Project</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProjectDetails && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Project Timeline</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedProjectDetails.startDate)} - {formatDate(selectedProjectDetails.estimatedEndDate)}
                </p>
                <p className="text-sm font-medium mt-2">Status</p>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedProjectDetails.status === ProjectStatus.IN_PROGRESS 
                      ? 'bg-green-100 text-green-800' 
                      : selectedProjectDetails.status === ProjectStatus.PLANNING 
                      ? 'bg-blue-100 text-blue-800' 
                      : selectedProjectDetails.status === ProjectStatus.ON_HOLD 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedProjectDetails.status
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <WXGanttChart
              tasks={tasks}
              onTaskUpdate={handleTaskDateUpdate}
              onLinkCreate={handleLinkCreate}
              onLinkDelete={handleLinkDelete}
            />
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              No tasks found for the selected project.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
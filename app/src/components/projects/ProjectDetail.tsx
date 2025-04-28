import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  User,
  Mail,
  Phone,
  Square,
  Loader2,
} from 'lucide-react';
import { projectService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, formatStatus } from '@/lib/utils';
import { ProjectStatus } from '@/types/project';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch project data
  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id as string),
    enabled: !!id,
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(id as string);
    }
  };

  // Determine status color
  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return 'bg-blue-100 text-blue-800';
      case ProjectStatus.IN_PROGRESS:
        return 'bg-green-100 text-green-800';
      case ProjectStatus.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800';
      case ProjectStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case ProjectStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading project details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p>Error loading project: {(error as Error).message}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/projects')}>
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
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status as ProjectStatus)}`}>
            {formatStatus(project.status)}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/edit/${project._id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p>{project.description}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p>{project.location}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Size</h3>
                <p>{project.squareFootage.toLocaleString()} sq ft</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
                <p>
                  {formatDate(project.startDate)} - {formatDate(project.estimatedEndDate)}
                  {project.estimatedDuration && ` (${project.estimatedDuration} days)`}
                </p>
                {project.actualEndDate && (
                  <p className="text-sm text-muted-foreground">
                    Actual End Date: {formatDate(project.actualEndDate)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Budget</h3>
                <p>Estimated: {formatCurrency(project.estimatedBudget)}</p>
                {project.actualBudget !== undefined && (
                  <p>Actual: {formatCurrency(project.actualBudget)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                <p>{project.clientName}</p>
              </div>
            </div>
            
            {project.clientEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{project.clientEmail}</p>
                </div>
              </div>
            )}
            
            {project.clientPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p>{project.clientPhone}</p>
                </div>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Project Created</h3>
              <p className="text-sm">{formatDate(project.createdAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
              <p className="text-sm">{formatDate(project.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks section with link to tasks page */}
      <div className="bg-muted p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Tasks & Timeline</h2>
          <Button asChild>
            <Link to={`/tasks/project/${project._id}`}>
              <Calendar className="mr-2 h-4 w-4" />
              View Tasks
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          View and manage tasks for this project, including schedule and dependencies.
        </p>
      </div>
      
      <div className="bg-muted p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Budget Details</h2>
          <Button asChild variant="outline">
            <Link to={`/budget?project=${project._id}`}>
              <DollarSign className="mr-2 h-4 w-4" />
              View Budget
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          View detailed budget breakdown and spending forecasts for this project.
        </p>
      </div>
    </div>
  );
};

export default ProjectDetail;
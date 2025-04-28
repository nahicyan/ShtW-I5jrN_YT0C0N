import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { ProjectFormData, ProjectStatus } from '@/types/project';
import { projectService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseDateForInput } from '@/lib/utils';

interface ProjectFormProps {
  isEditing?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Initial form state
  const initialFormState: ProjectFormData = {
    name: '',
    description: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    location: '',
    squareFootage: 0,
    estimatedBudget: 0,
    status: ProjectStatus.PLANNING,
    startDate: '',
    estimatedEndDate: '',
  };

  const [formData, setFormData] = useState<ProjectFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch project data if editing
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id as string),
    enabled: isEditing && !!id,
    onSuccess: (data) => {
      // Format dates for input fields
      setFormData({
        ...data,
        startDate: parseDateForInput(data.startDate),
        estimatedEndDate: parseDateForInput(data.estimatedEndDate),
        actualEndDate: data.actualEndDate ? parseDateForInput(data.actualEndDate) : undefined,
      });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormData) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
    onError: (error: any) => {
      console.error('Error creating project:', error);
      setErrors({
        form: 'Failed to create project. Please try again.',
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectFormData }) => 
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      navigate(`/projects/${id}`);
    },
    onError: (error: any) => {
      console.error('Error updating project:', error);
      setErrors({
        form: 'Failed to update project. Please try again.',
      });
    },
  });

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
    
    // Clear field-specific error when user makes changes
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field-specific error
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (formData.clientEmail && !/^\S+@\S+\.\S+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Invalid email format';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (formData.squareFootage <= 0) {
      newErrors.squareFootage = 'Square footage must be greater than 0';
    }
    
    if (formData.estimatedBudget <= 0) {
      newErrors.estimatedBudget = 'Estimated budget must be greater than 0';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.estimatedEndDate) {
      newErrors.estimatedEndDate = 'Estimated end date is required';
    }
    
    if (formData.startDate && formData.estimatedEndDate && 
        new Date(formData.startDate) > new Date(formData.estimatedEndDate)) {
      newErrors.estimatedEndDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEditing && id) {
      updateProjectMutation.mutate({ id, data: formData });
    } else {
      createProjectMutation.mutate(formData);
    }
  };

  if (isEditing && isLoadingProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading project data...</span>
      </div>
    );
  }

  const isSubmitting = createProjectMutation.isPending || updateProjectMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h1>
        </div>
      </div>

      {errors.form && (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Project Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
            
            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={errors.location ? 'border-destructive' : ''}
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="squareFootage">Square Footage <span className="text-destructive">*</span></Label>
              <Input
                id="squareFootage"
                name="squareFootage"
                type="number"
                value={formData.squareFootage || ''}
                onChange={handleChange}
                className={errors.squareFootage ? 'border-destructive' : ''}
              />
              {errors.squareFootage && <p className="text-sm text-destructive">{errors.squareFootage}</p>}
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
                  {Object.values(ProjectStatus).map((status) => (
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
          </div>
          
          {/* Client and Budget Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Client & Budget</h2>
            
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name <span className="text-destructive">*</span></Label>
              <Input
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className={errors.clientName ? 'border-destructive' : ''}
              />
              {errors.clientName && <p className="text-sm text-destructive">{errors.clientName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                value={formData.clientEmail || ''}
                onChange={handleChange}
                className={errors.clientEmail ? 'border-destructive' : ''}
              />
              {errors.clientEmail && <p className="text-sm text-destructive">{errors.clientEmail}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                name="clientPhone"
                value={formData.clientPhone || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Estimated Budget ($) <span className="text-destructive">*</span></Label>
              <Input
                id="estimatedBudget"
                name="estimatedBudget"
                type="number"
                value={formData.estimatedBudget || ''}
                onChange={handleChange}
                className={errors.estimatedBudget ? 'border-destructive' : ''}
              />
              {errors.estimatedBudget && <p className="text-sm text-destructive">{errors.estimatedBudget}</p>}
            </div>
            
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="actualBudget">Actual Budget ($)</Label>
                <Input
                  id="actualBudget"
                  name="actualBudget"
                  type="number"
                  value={formData.actualBudget || ''}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Timeline</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className={errors.startDate ? 'border-destructive' : ''}
              />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedEndDate">Estimated End Date <span className="text-destructive">*</span></Label>
              <Input
                id="estimatedEndDate"
                name="estimatedEndDate"
                type="date"
                value={formData.estimatedEndDate}
                onChange={handleChange}
                className={errors.estimatedEndDate ? 'border-destructive' : ''}
              />
              {errors.estimatedEndDate && <p className="text-sm text-destructive">{errors.estimatedEndDate}</p>}
            </div>
            
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="actualEndDate">Actual End Date</Label>
                <Input
                  id="actualEndDate"
                  name="actualEndDate"
                  type="date"
                  value={formData.actualEndDate || ''}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
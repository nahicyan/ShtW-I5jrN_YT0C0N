// app/src/components/projectTemplates/ProjectTemplateForm.tsx
import React, { useState, useEffect } from 'react';
import { ProjectTemplateFormData } from '@/types/projectTemplate';
import { Questionnaire } from '@/types/questionnaire';
import { TaskSet } from '@/types/taskSet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

interface ProjectTemplateFormProps {
  initialData?: Partial<ProjectTemplateFormData>;
  questionnaires: Questionnaire[];
  taskSets: TaskSet[];
  onSubmit: (data: ProjectTemplateFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const ProjectTemplateForm: React.FC<ProjectTemplateFormProps> = ({
  initialData,
  questionnaires,
  taskSets,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const defaultFormData: ProjectTemplateFormData = {
    name: '',
    description: '',
    questionnaireId: '',
    taskSetId: ''
  };

  const [formData, setFormData] = useState<ProjectTemplateFormData>({
    ...defaultFormData,
    ...initialData
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        questionnaireId: typeof initialData.questionnaireId === 'string' 
          ? initialData.questionnaireId 
          : initialData.questionnaireId?._id || '',
        taskSetId: typeof initialData.taskSetId === 'string' 
          ? initialData.taskSetId 
          : initialData.taskSetId?._id || ''
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
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
      newErrors.name = 'Project template name is required';
    }
    
    if (!formData.questionnaireId) {
      newErrors.questionnaireId = 'Questionnaire is required';
    }
    
    if (!formData.taskSetId) {
      newErrors.taskSetId = 'Task set is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter template name"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
        </div>
        
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Enter description"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="questionnaireId">Questionnaire</Label>
          <Select
            value={formData.questionnaireId}
            onValueChange={(value) => handleSelectChange('questionnaireId', value)}
          >
            <SelectTrigger id="questionnaireId" className={errors.questionnaireId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select questionnaire" />
            </SelectTrigger>
            <SelectContent>
              {questionnaires.map((questionnaire) => (
                <SelectItem key={questionnaire._id} value={questionnaire._id}>
                  {questionnaire.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.questionnaireId && (
            <p className="text-destructive text-sm mt-1">{errors.questionnaireId}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="taskSetId">Task Set</Label>
          <Select
            value={formData.taskSetId}
            onValueChange={(value) => handleSelectChange('taskSetId', value)}
          >
            <SelectTrigger id="taskSetId" className={errors.taskSetId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select task set" />
            </SelectTrigger>
            <SelectContent>
              {taskSets.map((taskSet) => (
                <SelectItem key={taskSet._id} value={taskSet._id}>
                  {taskSet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.taskSetId && (
            <p className="text-destructive text-sm mt-1">{errors.taskSetId}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {initialData?._id ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectTemplateForm;
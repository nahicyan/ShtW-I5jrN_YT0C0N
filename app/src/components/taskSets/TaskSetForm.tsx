import React, { useState, useEffect } from 'react';
import { TaskSetFormData } from '@/types/taskSet';
import { TaskTemplate } from '@/types/taskTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

interface TaskSetFormProps {
  initialData?: Partial<TaskSetFormData>;
  onSubmit: (data: TaskSetFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const TaskSetForm: React.FC<TaskSetFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const defaultFormData: TaskSetFormData = {
    name: '',
    description: '',
    taskTemplates: []
  };

  const [formData, setFormData] = useState<TaskSetFormData>({
    ...defaultFormData,
    ...initialData
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Task set name is required';
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
    <Card>
      <CardHeader>
        <CardTitle>{initialData?._id ? 'Edit Task Set' : 'Create Task Set'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Task Set Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter task set name"
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
              {initialData?._id ? 'Update Task Set' : 'Create Task Set'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskSetForm;
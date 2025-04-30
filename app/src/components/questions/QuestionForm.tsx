import React, { useState, useEffect } from 'react';
import { QuestionType, QuestionFormData } from '@/types/questionnaire';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trash2, 
  Plus, 
  Save, 
  Loader2 
} from 'lucide-react';

interface QuestionFormProps {
  initialData?: QuestionFormData;
  onSubmit: (data: QuestionFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isSubmitting = false
}) => {
  const defaultFormData: QuestionFormData = {
    text: '',
    answerType: QuestionType.TEXT,
    isRequired: false,
    options: [],
  };

  const [formData, setFormData] = useState<QuestionFormData>(initialData || defaultFormData);
  const [newOption, setNewOption] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleSelectChange = (name: string, value: any) => {
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
    
    // Reset options when changing from a select type to another type
    if (name === 'answerType' && 
        value !== QuestionType.SELECT && 
        value !== QuestionType.MULTISELECT &&
        (formData.answerType === QuestionType.SELECT || 
         formData.answerType === QuestionType.MULTISELECT)) {
      setFormData(prev => ({
        ...prev,
        options: [],
      }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    
    setFormData({
      ...formData,
      options: [...(formData.options || []), newOption.trim()],
    });
    setNewOption('');
    
    if (errors.options) {
      setErrors({
        ...errors,
        options: '',
      });
    }
  };

  const removeOption = (index: number) => {
    const updatedOptions = [...(formData.options || [])];
    updatedOptions.splice(index, 1);
    
    setFormData({
      ...formData,
      options: updatedOptions,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.text.trim()) {
      newErrors.text = 'Question text is required';
    }
    
    if ((formData.answerType === QuestionType.SELECT || 
         formData.answerType === QuestionType.MULTISELECT) && 
        (!formData.options || formData.options.length === 0)) {
      newErrors.options = 'Select questions must have at least one option';
    }
    
    if (formData.answerType === QuestionType.RANGE || 
        formData.answerType === QuestionType.NUMBER) {
      if (formData.minValue !== undefined && 
          formData.maxValue !== undefined && 
          formData.minValue > formData.maxValue) {
        newErrors.maxValue = 'Maximum value must be greater than or equal to minimum value';
      }
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
        <CardTitle>{initialData ? 'Edit Question' : 'Create Question'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Question Text</Label>
              <Textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder="Enter question text"
                className={errors.text ? 'border-destructive' : ''}
              />
              {errors.text && <p className="text-destructive text-sm mt-1">{errors.text}</p>}
            </div>
            
            <div>
              <Label htmlFor="answerType">Answer Type</Label>
              <Select
                value={formData.answerType}
                onValueChange={(value) => handleSelectChange('answerType', value)}
              >
                <SelectTrigger id="answerType">
                  <SelectValue placeholder="Select answer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
                  <SelectItem value={QuestionType.NUMBER}>Number</SelectItem>
                  <SelectItem value={QuestionType.RANGE}>Range</SelectItem>
                  <SelectItem value={QuestionType.SELECT}>Select (Dropdown)</SelectItem>
                  <SelectItem value={QuestionType.MULTISELECT}>Multi-select</SelectItem>
                  <SelectItem value={QuestionType.DATE}>Date</SelectItem>
                  <SelectItem value={QuestionType.BOOLEAN}>Yes/No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isRequired" 
                checked={formData.isRequired}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('isRequired', checked === true)
                }
              />
              <Label htmlFor="isRequired">Required Question</Label>
            </div>
            
            {(formData.answerType === QuestionType.NUMBER || 
              formData.answerType === QuestionType.RANGE) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minValue">Minimum Value</Label>
                  <Input
                    id="minValue"
                    name="minValue"
                    type="number"
                    value={formData.minValue ?? ''}
                    onChange={handleChange}
                    placeholder="Min value"
                  />
                </div>
                <div>
                  <Label htmlFor="maxValue">Maximum Value</Label>
                  <Input
                    id="maxValue"
                    name="maxValue"
                    type="number"
                    value={formData.maxValue ?? ''}
                    onChange={handleChange}
                    placeholder="Max value"
                    className={errors.maxValue ? 'border-destructive' : ''}
                  />
                  {errors.maxValue && (
                    <p className="text-destructive text-sm mt-1">{errors.maxValue}</p>
                  )}
                </div>
              </div>
            )}
            
            {(formData.answerType === QuestionType.SELECT || 
              formData.answerType === QuestionType.MULTISELECT) && (
              <div>
                <Label htmlFor="options">Options</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="newOption"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add option"
                      className={errors.options ? 'border-destructive' : ''}
                    />
                    <Button type="button" onClick={addOption} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.options && (
                    <p className="text-destructive text-sm">{errors.options}</p>
                  )}
                  
                  <div className="space-y-2 mt-2">
                    {formData.options && formData.options.map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span>{option}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {formData.answerType !== QuestionType.BOOLEAN && (
              <div>
                <Label htmlFor="defaultValue">Default Value</Label>
                {formData.answerType === QuestionType.TEXT && (
                  <Input
                    id="defaultValue"
                    name="defaultValue"
                    value={formData.defaultValue as string || ''}
                    onChange={handleChange}
                    placeholder="Default text"
                  />
                )}
                
                {formData.answerType === QuestionType.NUMBER && (
                  <Input
                    id="defaultValue"
                    name="defaultValue"
                    type="number"
                    value={formData.defaultValue as number || ''}
                    onChange={handleChange}
                    placeholder="Default number"
                  />
                )}
                
                {formData.answerType === QuestionType.RANGE && (
                  <Input
                    id="defaultValue"
                    name="defaultValue"
                    type="range"
                    min={formData.minValue || 0}
                    max={formData.maxValue || 100}
                    value={formData.defaultValue as number || 0}
                    onChange={handleChange}
                  />
                )}
                
                {formData.answerType === QuestionType.DATE && (
                  <Input
                    id="defaultValue"
                    name="defaultValue"
                    type="date"
                    value={formData.defaultValue as string || ''}
                    onChange={handleChange}
                  />
                )}
                
                {formData.answerType === QuestionType.SELECT && formData.options && (
                  <Select
                    value={formData.defaultValue as string || ''}
                    onValueChange={(value) => handleSelectChange('defaultValue', value)}
                  >
                    <SelectTrigger id="defaultValue">
                      <SelectValue placeholder="Select default option" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.options.map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            
            {formData.answerType === QuestionType.BOOLEAN && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="defaultValueBool" 
                  checked={formData.defaultValue === true}
                  onCheckedChange={(checked) => 
                    handleSelectChange('defaultValue', checked === true)
                  }
                />
                <Label htmlFor="defaultValueBool">Default Value (Yes/True)</Label>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {initialData ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
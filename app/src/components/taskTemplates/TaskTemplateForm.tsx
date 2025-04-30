import React, { useState, useEffect } from 'react';
import { Question } from '@/types/questionnaire';
import { 
  TaskTemplateFormData, 
  DurationType, 
  ConditionOperator, 
  ConditionAction, 
  BudgetAdjustmentType,
  DisplayCondition,
  BudgetAdjustment
} from '@/types/taskTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trash2, 
  Plus, 
  Save, 
  Loader2,
  Clock
} from 'lucide-react';

interface TaskTemplateFormProps {
  initialData?: Partial<TaskTemplateFormData>;
  availableTaskTemplates?: { _id: string; name: string }[];
  questions?: Question[];
  onSubmit: (data: TaskTemplateFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const TaskTemplateForm: React.FC<TaskTemplateFormProps> = ({
  initialData,
  availableTaskTemplates = [],
  questions = [],
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const defaultFormData: TaskTemplateFormData = {
    name: '',
    description: '',
    duration: 1,
    durationType: DurationType.FROM_PROJECT_START,
    displayConditions: [],
    budgetAdjustments: [],
    estimatedBudget: 0,
    dependencies: []
  };

  const [formData, setFormData] = useState<TaskTemplateFormData>({
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
    const { name, value, type } = e.target;
    
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
  };

  const handleMultiSelectChange = (name: string, value: string, checked: boolean) => {
    const currentValues = formData[name as keyof TaskTemplateFormData] as string[];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(item => item !== value);
    }
    
    setFormData({
      ...formData,
      [name]: newValues,
    });
  };

  // Display Conditions
  const addDisplayCondition = () => {
    if (questions.length === 0) return;
    
    const newCondition: DisplayCondition = {
      questionId: questions[0]._id,
      operator: ConditionOperator.EQUALS,
      value: '',
      action: ConditionAction.SHOW
    };
    
    setFormData({
      ...formData,
      displayConditions: [...formData.displayConditions, newCondition]
    });
  };

  const updateDisplayCondition = (index: number, field: keyof DisplayCondition, value: any) => {
    const updatedConditions = [...formData.displayConditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      displayConditions: updatedConditions
    });
  };

  const removeDisplayCondition = (index: number) => {
    const updatedConditions = [...formData.displayConditions];
    updatedConditions.splice(index, 1);
    
    setFormData({
      ...formData,
      displayConditions: updatedConditions
    });
  };

  // Budget Adjustments
  const addBudgetAdjustment = () => {
    if (questions.length === 0) return;
    
    const newAdjustment: BudgetAdjustment = {
      questionId: questions[0]._id,
      operator: ConditionOperator.EQUALS,
      value: '',
      adjustmentType: BudgetAdjustmentType.FIXED,
      amount: 0
    };
    
    setFormData({
      ...formData,
      budgetAdjustments: [...formData.budgetAdjustments, newAdjustment]
    });
  };

  const updateBudgetAdjustment = (index: number, field: keyof BudgetAdjustment, value: any) => {
    const updatedAdjustments = [...formData.budgetAdjustments];
    updatedAdjustments[index] = {
      ...updatedAdjustments[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      budgetAdjustments: updatedAdjustments
    });
  };

  const removeBudgetAdjustment = (index: number) => {
    const updatedAdjustments = [...formData.budgetAdjustments];
    updatedAdjustments.splice(index, 1);
    
    setFormData({
      ...formData,
      budgetAdjustments: updatedAdjustments
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Task template name is required';
    }
    
    if (formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 day';
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

  // Get question by ID
  const getQuestionById = (id: string): Question | undefined => {
    return questions.find(q => q._id === id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?._id ? 'Edit Task Template' : 'Create Task Template'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Task Template Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter task template name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
              </div>
            
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Enter description"
                  rows={2}
                />
              </div>
            </div>

            {/* Duration & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min={1}
                    value={formData.duration}
                    onChange={handleChange}
                    className={errors.duration ? 'border-destructive' : ''}
                  />
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                {errors.duration && <p className="text-destructive text-sm mt-1">{errors.duration}</p>}
              </div>
              
              <div>
                <Label htmlFor="durationType">Duration Type</Label>
                <Select
                  value={formData.durationType}
                  onValueChange={(value) => handleSelectChange('durationType', value)}
                >
                  <SelectTrigger id="durationType">
                    <SelectValue placeholder="Select duration type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DurationType.FROM_PROJECT_START}>From Project Start</SelectItem>
                    <SelectItem value={DurationType.FROM_PREVIOUS_TASK}>After Previous Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estimated Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedBudget">Estimated Budget ($)</Label>
                <Input
                  id="estimatedBudget"
                  name="estimatedBudget"
                  type="number"
                  min={0}
                  step={100}
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <Label>Dependencies</Label>
              <div className="mt-2 border rounded-md p-4">
                <div className="space-y-2">
                  {availableTaskTemplates.length > 0 ? (
                    availableTaskTemplates
                      .filter(template => template._id !== initialData?._id) // Filter out self
                      .map(template => (
                        <div key={template._id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`dep-${template._id}`}
                            checked={formData.dependencies.includes(template._id)}
                            onCheckedChange={(checked) => handleMultiSelectChange('dependencies', template._id, checked === true)}
                          />
                          <Label htmlFor={`dep-${template._id}`} className="font-normal">{template.name}</Label>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground">No other task templates available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Display Conditions */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Display Conditions</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addDisplayCondition}
                  disabled={questions.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Condition
                </Button>
              </div>
              
              {formData.displayConditions.length === 0 ? (
                <div className="border rounded-md p-4 text-center text-muted-foreground">
                  No display conditions added. Task will always be created.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.displayConditions.map((condition, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Condition {index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeDisplayCondition(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>When Question</Label>
                          <Select
                            value={condition.questionId}
                            onValueChange={(value) => updateDisplayCondition(index, 'questionId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select question" />
                            </SelectTrigger>
                            <SelectContent>
                              {questions.map(question => (
                                <SelectItem key={question._id} value={question._id}>
                                  {question.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Operator</Label>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) => updateDisplayCondition(index, 'operator', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ConditionOperator.EQUALS}>Equals</SelectItem>
                                <SelectItem value={ConditionOperator.NOT_EQUALS}>Not Equals</SelectItem>
                                <SelectItem value={ConditionOperator.GREATER_THAN}>Greater Than</SelectItem>
                                <SelectItem value={ConditionOperator.LESS_THAN}>Less Than</SelectItem>
                                <SelectItem value={ConditionOperator.CONTAINS}>Contains</SelectItem>
                                <SelectItem value={ConditionOperator.NOT_CONTAINS}>Not Contains</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Value</Label>
                            <Input
                              value={condition.value}
                              onChange={(e) => updateDisplayCondition(index, 'value', e.target.value)}
                              placeholder="Enter value"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Action</Label>
                          <Select
                            value={condition.action}
                            onValueChange={(value) => updateDisplayCondition(index, 'action', value as ConditionAction)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ConditionAction.SHOW}>Show Task</SelectItem>
                              <SelectItem value={ConditionAction.HIDE}>Hide Task</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Budget Adjustments */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Budget Adjustments</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={addBudgetAdjustment}
                  disabled={questions.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Adjustment
                </Button>
              </div>
              
              {formData.budgetAdjustments.length === 0 ? (
                <div className="border rounded-md p-4 text-center text-muted-foreground">
                  No budget adjustments added. Budget will be fixed.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.budgetAdjustments.map((adjustment, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Adjustment {index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeBudgetAdjustment(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>When Question</Label>
                          <Select
                            value={adjustment.questionId}
                            onValueChange={(value) => updateBudgetAdjustment(index, 'questionId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select question" />
                            </SelectTrigger>
                            <SelectContent>
                              {questions.map(question => (
                                <SelectItem key={question._id} value={question._id}>
                                  {question.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Operator</Label>
                            <Select
                              value={adjustment.operator}
                              onValueChange={(value) => updateBudgetAdjustment(index, 'operator', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ConditionOperator.EQUALS}>Equals</SelectItem>
                                <SelectItem value={ConditionOperator.NOT_EQUALS}>Not Equals</SelectItem>
                                <SelectItem value={ConditionOperator.GREATER_THAN}>Greater Than</SelectItem>
                                <SelectItem value={ConditionOperator.LESS_THAN}>Less Than</SelectItem>
                                <SelectItem value={ConditionOperator.CONTAINS}>Contains</SelectItem>
                                <SelectItem value={ConditionOperator.NOT_CONTAINS}>Not Contains</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Value</Label>
                            <Input
                              value={adjustment.value}
                              onChange={(e) => updateBudgetAdjustment(index, 'value', e.target.value)}
                              placeholder="Enter value"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Adjustment Type</Label>
                          <Select
                            value={adjustment.adjustmentType}
                            onValueChange={(value) => updateBudgetAdjustment(index, 'adjustmentType', value as BudgetAdjustmentType)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={BudgetAdjustmentType.FIXED}>Fixed Amount</SelectItem>
                              <SelectItem value={BudgetAdjustmentType.PER_UNIT}>Per Unit</SelectItem>
                              <SelectItem value={BudgetAdjustmentType.FORMULA}>Formula</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>
                            {adjustment.adjustmentType === BudgetAdjustmentType.FIXED ? "Amount ($)" :
                             adjustment.adjustmentType === BudgetAdjustmentType.PER_UNIT ? "Amount Per Unit ($)" :
                             "Formula"}
                          </Label>
                          {adjustment.adjustmentType === BudgetAdjustmentType.FORMULA ? (
                            <Textarea
                              value={adjustment.amount as string}
                              onChange={(e) => updateBudgetAdjustment(index, 'amount', e.target.value)}
                              placeholder="Enter formula (e.g., [answer] * 100)"
                            />
                          ) : (
                            <Input
                              type="number"
                              value={adjustment.amount as number}
                              onChange={(e) => updateBudgetAdjustment(index, 'amount', Number(e.target.value))}
                              placeholder="Enter amount"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
              {initialData?._id ? 'Update Task Template' : 'Create Task Template'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskTemplateForm;
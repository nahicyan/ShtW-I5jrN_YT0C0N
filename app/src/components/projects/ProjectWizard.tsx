// app/src/components/projects/ProjectWizard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectTemplateService, projectService, questionnaireService } from '@/services/api';
import { Question, QuestionType } from '@/types/questionnaire';
import { ProjectFormData, ProjectStatus } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Save, TemplateIcon } from 'lucide-react';
import { parseDateForInput } from '@/lib/utils';

interface ProjectAnswers {
  [questionId: string]: string | number | boolean;
}

const ProjectWizard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Wizard steps
  const [step, setStep] = useState(1);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    location: '',
    squareFootage: 0,
    estimatedBudget: 0,
    status: ProjectStatus.PLANNING,
    startDate: parseDateForInput(new Date().toISOString()),
    estimatedEndDate: parseDateForInput(new Date(
      new Date().setMonth(new Date().getMonth() + 1)
    ).toISOString()),
  });
  const [questionAnswers, setQuestionAnswers] = useState<ProjectAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch project templates
  const { 
    data: projectTemplates,
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: projectTemplateService.getProjectTemplates,
  });
  
  // Fetch selected template details
  const {
    data: selectedTemplate,
    isLoading: isLoadingSelectedTemplate,
  } = useQuery({
    queryKey: ['projectTemplate', selectedTemplateId],
    queryFn: () => projectTemplateService.getProjectTemplate(selectedTemplateId),
    enabled: !!selectedTemplateId,
  });
  
  // Fetch questionnaire questions when template is selected
  const {
    data: questionnaireData,
    isLoading: isLoadingQuestionnaire,
  } = useQuery({
    queryKey: ['questionnaire', selectedTemplate?.questionnaireId],
    queryFn: () => {
      const id = typeof selectedTemplate?.questionnaireId === 'string' 
        ? selectedTemplate.questionnaireId 
        : selectedTemplate?.questionnaireId?._id;
      
      return id ? questionnaireService.getQuestionnaire(id) : null;
    },
    enabled: !!selectedTemplate?.questionnaireId,
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormData) => projectService.createProject(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${data._id}`);
      toast.success('Project created successfully');
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    },
  });
  
  // Create project from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: (data: { templateId: string; questionAnswers: ProjectAnswers; [key: string]: any }) => 
      projectService.createProjectFromTemplate(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${data._id}`);
      toast.success('Project created successfully from template');
    },
    onError: (error) => {
      console.error('Error creating project from template:', error);
      toast.error('Failed to create project from template');
    },
  });
  
  // Handle input changes for basic project form
  const handleProjectInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setProjectFormData({
        ...projectFormData,
        [name]: value === '' ? 0 : Number(value),
      });
    } else {
      setProjectFormData({
        ...projectFormData,
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
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setProjectFormData({
      ...projectFormData,
      [name]: value,
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  // Handle questionnaire answer changes
  const handleQuestionAnswerChange = (questionId: string, value: string | number | boolean) => {
    setQuestionAnswers({
      ...questionAnswers,
      [questionId]: value
    });
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    // Reset answers when changing templates
    setQuestionAnswers({});
  };
  
  // Validate the current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      // No validation for template selection
      return true;
    }
    else if (step === 2) {
      if (!projectFormData.name.trim()) {
        newErrors.name = 'Project name is required';
      }
      
      if (!projectFormData.clientName.trim()) {
        newErrors.clientName = 'Client name is required';
      }
      
      if (projectFormData.clientEmail && !/^\S+@\S+\.\S+$/.test(projectFormData.clientEmail)) {
        newErrors.clientEmail = 'Invalid email format';
      }
      
      if (!projectFormData.location.trim()) {
        newErrors.location = 'Location is required';
      }
      
      if (projectFormData.squareFootage <= 0) {
        newErrors.squareFootage = 'Square footage must be greater than 0';
      }
      
      if (projectFormData.estimatedBudget <= 0) {
        newErrors.estimatedBudget = 'Estimated budget must be greater than 0';
      }
      
      if (!projectFormData.startDate) {
        newErrors.startDate = 'Start date is required';
      }
      
      if (!projectFormData.estimatedEndDate) {
        newErrors.estimatedEndDate = 'Estimated end date is required';
      }
      
      if (projectFormData.startDate && projectFormData.estimatedEndDate && 
          new Date(projectFormData.startDate) > new Date(projectFormData.estimatedEndDate)) {
        newErrors.estimatedEndDate = 'End date must be after start date';
      }
    }
    else if (step === 3 && useTemplate) {
      // Check for required questions
      const questions = questionnaireData?.questions as Question[];
      
      if (questions) {
        questions.forEach(question => {
          if (question.isRequired && 
              (!questionAnswers[question._id] || 
               questionAnswers[question._id] === '' || 
               questionAnswers[question._id] === null)) {
            newErrors[question._id] = 'This question is required';
          }
        });
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigate to the next step
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
  };
  
  // Navigate to the previous step
  const goToPrevStep = () => {
    setStep(step - 1);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    if (useTemplate && selectedTemplateId) {
      createFromTemplateMutation.mutate({
        templateId: selectedTemplateId,
        questionAnswers,
        ...projectFormData
      });
    } else {
      createProjectMutation.mutate(projectFormData);
    }
  };
  
  // Render question input based on type
  const renderQuestionInput = (question: Question) => {
    const answer = questionAnswers[question._id];
    const error = errors[question._id];
    
    switch(question.answerType) {
      case QuestionType.TEXT:
        return (
          <Input
            value={answer as string || ''}
            onChange={(e) => handleQuestionAnswerChange(question._id, e.target.value)}
            placeholder="Enter your answer"
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case QuestionType.NUMBER:
        return (
          <Input
            type="number"
            value={answer as number || ''}
            onChange={(e) => handleQuestionAnswerChange(question._id, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Enter a number"
            min={question.minValue}
            max={question.maxValue}
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case QuestionType.RANGE:
        return (
          <div className="flex flex-col space-y-2">
            <Input
              type="range"
              value={answer as number || question.minValue || 0}
              onChange={(e) => handleQuestionAnswerChange(question._id, Number(e.target.value))}
              min={question.minValue || 0}
              max={question.maxValue || 100}
              step={1}
              className={error ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{question.minValue || 0}</span>
              <span>{answer !== undefined ? answer : question.minValue || 0}</span>
              <span>{question.maxValue || 100}</span>
            </div>
          </div>
        );
      
      case QuestionType.SELECT:
        return (
          <Select
            value={answer as string || ''}
            onValueChange={(value) => handleQuestionAnswerChange(question._id, value)}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case QuestionType.MULTISELECT:
        // For simplicity, handle multiselect as a single select for now
        return (
          <Select
            value={answer as string || ''}
            onValueChange={(value) => handleQuestionAnswerChange(question._id, value)}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case QuestionType.DATE:
        return (
          <Input
            type="date"
            value={answer as string || ''}
            onChange={(e) => handleQuestionAnswerChange(question._id, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case QuestionType.BOOLEAN:
        return (
          <Select
            value={String(answer) || ''}
            onValueChange={(value) => handleQuestionAnswerChange(question._id, value === 'true')}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select yes or no" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={answer as string || ''}
            onChange={(e) => handleQuestionAnswerChange(question._id, e.target.value)}
            placeholder="Enter your answer"
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };
  
  // Determine if the form is submitting
  const isSubmitting = createProjectMutation.isPending || createFromTemplateMutation.isPending;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
      </div>
      
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          <div className={`w-12 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          <div className={`w-12 h-1 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
        </div>
      </div>
      
      {/* Step 1: Template Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Project Creation Method</CardTitle>
            <CardDescription>
              Choose whether to create a blank project or use a template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={useTemplate ? "template" : "blank"} onValueChange={(value) => setUseTemplate(value === "template")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="blank">Create Blank Project</TabsTrigger>
                <TabsTrigger value="template">Use Project Template</TabsTrigger>
              </TabsList>
              
              <TabsContent value="blank" className="p-4">
                <div className="text-center p-6">
                  <p className="text-muted-foreground mb-4">
                    Create a new project without using a template. You'll need to add tasks manually later.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="template" className="p-4">
                {isLoadingTemplates ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading templates...</span>
                  </div>
                ) : (projectTemplates && projectTemplates.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectTemplates.map(template => (
                      <Card 
                        key={template._id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplateId === template._id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template._id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                          )}
                          <div className="flex justify-between text-sm">
                            <span>
                              Questionnaire: {typeof template.questionnaireId === 'string' ? 
                                '#' + template.questionnaireId.substring(0, 6) : 
                                template.questionnaireId.name}
                            </span>
                            <span>
                              Task Set: {typeof template.taskSetId === 'string' ? 
                                '#' + template.taskSetId.substring(0, 6) : 
                                template.taskSetId.name}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">No project templates available.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <div className="flex justify-end p-6">
            <Button onClick={goToNextStep}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
      
      {/* Step 2: Project Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter basic information about your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Project Information</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={projectFormData.name}
                      onChange={handleProjectInputChange}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={projectFormData.description || ''}
                      onChange={handleProjectInputChange}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                    <Input
                      id="location"
                      name="location"
                      value={projectFormData.location}
                      onChange={handleProjectInputChange}
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
                      value={projectFormData.squareFootage || ''}
                      onChange={handleProjectInputChange}
                      className={errors.squareFootage ? 'border-destructive' : ''}
                    />
                    {errors.squareFootage && <p className="text-sm text-destructive">{errors.squareFootage}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={projectFormData.status} 
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
                      value={projectFormData.clientName}
                      onChange={handleProjectInputChange}
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
                      value={projectFormData.clientEmail || ''}
                      onChange={handleProjectInputChange}
                      className={errors.clientEmail ? 'border-destructive' : ''}
                    />
                    {errors.clientEmail && <p className="text-sm text-destructive">{errors.clientEmail}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Client Phone</Label>
                    <Input
                      id="clientPhone"
                      name="clientPhone"
                      value={projectFormData.clientPhone || ''}
                      onChange={handleProjectInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedBudget">Estimated Budget ($) <span className="text-destructive">*</span></Label>
                    <Input
                      id="estimatedBudget"
                      name="estimatedBudget"
                      type="number"
                      value={projectFormData.estimatedBudget || ''}
                      onChange={handleProjectInputChange}
                      className={errors.estimatedBudget ? 'border-destructive' : ''}
                    />
                    {errors.estimatedBudget && <p className="text-sm text-destructive">{errors.estimatedBudget}</p>}
                  </div>
                  
                  <div className="pt-4">
                    <h2 className="text-xl font-semibold mb-2">Timeline</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date <span className="text-destructive">*</span></Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={projectFormData.startDate}
                          onChange={handleProjectInputChange}
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
                          value={projectFormData.estimatedEndDate}
                          onChange={handleProjectInputChange}
                          className={errors.estimatedEndDate ? 'border-destructive' : ''}
                        />
                        {errors.estimatedEndDate && <p className="text-sm text-destructive">{errors.estimatedEndDate}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="flex justify-between p-6">
            <Button variant="outline" onClick={goToPrevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {useTemplate ? (
              <Button onClick={goToNextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        </Card>
      )}
      
      {/* Step 3: Questionnaire (if using template) */}
      {step === 3 && useTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Project Questionnaire</CardTitle>
            <CardDescription>
              Answer these questions to customize your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSelectedTemplate || isLoadingQuestionnaire ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading questionnaire...</span>
              </div>
            ) : questionnaireData && Array.isArray(questionnaireData.questions) ? (
              <div className="space-y-6">
                {questionnaireData.questions.map((question: Question) => (
                  <div key={question._id} className="space-y-2">
                    <Label>
                      {question.text}
                      {question.isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderQuestionInput(question)}
                    {errors[question._id] && <p className="text-sm text-destructive">{errors[question._id]}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="text-muted-foreground">No questions found in this questionnaire.</p>
              </div>
            )}
          </CardContent>
          <div className="flex justify-between p-6">
            <Button variant="outline" onClick={goToPrevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectWizard;
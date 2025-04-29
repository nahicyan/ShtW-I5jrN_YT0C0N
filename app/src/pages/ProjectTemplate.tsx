import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Gantt, Willow } from "wx-react-gantt";
import { Plus, Save, Trash2, ArrowRight, ArrowLeft, Calendar, DollarSign, HelpCircle, FileText } from 'lucide-react';
import "wx-react-gantt/dist/gantt.css";

// Input types for questions
enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  BOOLEAN = 'boolean',
  DATE = 'date',
  SLIDER = 'slider'
}

// Task status types
enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

// Interface for a template question
interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // For select questions
  min?: number; // For number/slider questions
  max?: number; // For number/slider questions
  step?: number; // For slider questions
}

// Interface for a form response
interface Responses {
  [key: string]: any;
}

// Interface for a task
interface Task {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  dependencies: string[];
  budget: number;
  status: TaskStatus;
}

// Interface for a task rule (conditional logic)
interface TaskRule {
  id: string;
  taskId: string;
  conditions: Condition[];
  budget: BudgetRule;
}

// Interface for a condition
interface Condition {
  id: string;
  questionId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

// Interface for budget calculation rule
interface BudgetRule {
  type: 'fixed' | 'formula' | 'per_unit';
  value: number;
  formula?: string;
  unitQuestionId?: string;
}

// ProjectTemplate component
const ProjectTemplate: React.FC = () => {
  // State for multi-step form
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // State for template name
  const [templateName, setTemplateName] = useState<string>('New Project Template');
  
  // State for questions
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('projectTemplateQuestions');
    return saved ? JSON.parse(saved) : [];
  });
  
  // State for responses
  const [responses, setResponses] = useState<Responses>(() => {
    const saved = localStorage.getItem('projectTemplateResponses');
    return saved ? JSON.parse(saved) : {};
  });
  
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('projectTemplateTasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((task: any) => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate)
      }));
    }
    return [];
  });
  
  // State for task rules
  const [taskRules, setTaskRules] = useState<TaskRule[]>(() => {
    const saved = localStorage.getItem('projectTemplateTaskRules');
    return saved ? JSON.parse(saved) : [];
  });
  
  // State for current active task and rule for editing
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  
  // State for dialogs
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState<boolean>(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState<boolean>(false);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState<boolean>(false);
  
  // State for new question
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: '',
    type: QuestionType.TEXT,
    required: true,
    options: ['']
  });
  
  // State for new task
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    dependencies: [],
    budget: 0,
    status: TaskStatus.NOT_STARTED
  });
  
  // State for new rule
  const [newRule, setNewRule] = useState<Partial<TaskRule>>({
    conditions: [{ 
      id: uuidv4(),
      questionId: '',
      operator: 'equals',
      value: ''
    }],
    budget: {
      type: 'fixed',
      value: 0
    }
  });
  
  // Save data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('projectTemplateQuestions', JSON.stringify(questions));
    localStorage.setItem('projectTemplateResponses', JSON.stringify(responses));
    localStorage.setItem('projectTemplateTasks', JSON.stringify(tasks));
    localStorage.setItem('projectTemplateTaskRules', JSON.stringify(taskRules));
    localStorage.setItem('projectTemplateName', templateName);
  }, [questions, responses, tasks, taskRules, templateName]);
  
  // Effect to load template name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('projectTemplateName');
    if (savedName) {
      setTemplateName(savedName);
    }
  }, []);
  
  // Calculate applicable tasks based on responses and rules
  const calculateApplicableTasks = (): Task[] => {
    if (Object.keys(responses).length === 0) return [];
    
    return tasks.filter(task => {
      // Get rules for this task
      const rules = taskRules.filter(rule => rule.taskId === task.id);
      
      // If no rules, task is always included
      if (rules.length === 0) return true;
      
      // Check if any rule matches
      return rules.some(rule => {
        // All conditions must match
        return rule.conditions.every(condition => {
          const response = responses[condition.questionId];
          if (response === undefined) return false;
          
          switch (condition.operator) {
            case 'equals':
              return response === condition.value;
            case 'not_equals':
              return response !== condition.value;
            case 'greater_than':
              return Number(response) > Number(condition.value);
            case 'less_than':
              return Number(response) < Number(condition.value);
            case 'contains':
              return String(response).includes(String(condition.value));
            default:
              return false;
          }
        });
      });
    });
  };
  
  // Calculate budget for tasks based on responses and rules
  const calculateTaskBudget = (task: Task): number => {
    // Get rules for this task
    const rules = taskRules.filter(rule => rule.taskId === task.id);
    
    // If no rules, use default budget
    if (rules.length === 0) return task.budget;
    
    // Find first matching rule
    const matchingRule = rules.find(rule => {
      return rule.conditions.every(condition => {
        const response = responses[condition.questionId];
        if (response === undefined) return false;
        
        switch (condition.operator) {
          case 'equals':
            return response === condition.value;
          case 'not_equals':
            return response !== condition.value;
          case 'greater_than':
            return Number(response) > Number(condition.value);
          case 'less_than':
            return Number(response) < Number(condition.value);
          case 'contains':
            return String(response).includes(String(condition.value));
          default:
            return false;
        }
      });
    });
    
    if (!matchingRule) return task.budget;
    
    // Calculate budget based on rule
    const budget = matchingRule.budget;
    switch (budget.type) {
      case 'fixed':
        return budget.value;
      case 'per_unit':
        if (!budget.unitQuestionId) return budget.value;
        const units = Number(responses[budget.unitQuestionId]) || 0;
        return budget.value * units;
      case 'formula':
        if (!budget.formula) return budget.value;
        try {
          // Simple formula evaluation (unsafe, but for demo purposes)
          // In a real app, you'd use a safe formula parser
          const formula = budget.formula;
          const evaluatedFormula = formula.replace(/\${([^}]+)}/g, (match, questionId) => {
            return responses[questionId] || 0;
          });
          return eval(evaluatedFormula);
        } catch (e) {
          console.error('Formula evaluation error:', e);
          return budget.value;
        }
      default:
        return budget.value;
    }
  };
  
  // Calculate total budget
  const calculateTotalBudget = (): number => {
    const applicableTasks = calculateApplicableTasks();
    return applicableTasks.reduce((total, task) => {
      return total + calculateTaskBudget(task);
    }, 0);
  };
  
  // Function to add a new question
  const handleAddQuestion = () => {
    if (!newQuestion.text) return;
    
    const question: Question = {
      id: uuidv4(),
      text: newQuestion.text || '',
      type: newQuestion.type || QuestionType.TEXT,
      required: newQuestion.required || false,
      options: newQuestion.type === QuestionType.SELECT ? newQuestion.options : undefined,
      min: (newQuestion.type === QuestionType.NUMBER || newQuestion.type === QuestionType.SLIDER) ? newQuestion.min : undefined,
      max: (newQuestion.type === QuestionType.NUMBER || newQuestion.type === QuestionType.SLIDER) ? newQuestion.max : undefined,
      step: newQuestion.type === QuestionType.SLIDER ? newQuestion.step : undefined,
    };
    
    setQuestions([...questions, question]);
    setNewQuestion({
      text: '',
      type: QuestionType.TEXT,
      required: true,
      options: ['']
    });
    setIsAddQuestionDialogOpen(false);
  };
  
  // Function to update option for a select question
  const handleOptionChange = (index: number, value: string) => {
    const options = [...(newQuestion.options || [])];
    options[index] = value;
    setNewQuestion({ ...newQuestion, options });
  };
  
  // Function to add an option for a select question
  const handleAddOption = () => {
    setNewQuestion({ 
      ...newQuestion, 
      options: [...(newQuestion.options || []), ''] 
    });
  };
  
  // Function to remove an option for a select question
  const handleRemoveOption = (index: number) => {
    const options = [...(newQuestion.options || [])];
    options.splice(index, 1);
    setNewQuestion({ ...newQuestion, options });
  };
  
  // Function to remove a question
  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    // Also remove this question from responses and any rules
    const newResponses = { ...responses };
    delete newResponses[id];
    setResponses(newResponses);
    
    // Update rules that use this question
    const updatedRules = taskRules.map(rule => {
      const updatedConditions = rule.conditions.filter(c => c.questionId !== id);
      return {
        ...rule,
        conditions: updatedConditions
      };
    });
    setTaskRules(updatedRules);
  };
  
  // Function to handle response changes
  const handleResponseChange = (questionId: string, value: any) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };
  
  // Function to add a new task
  const handleAddTask = () => {
    if (!newTask.name) return;
    
    const task: Task = {
      id: uuidv4(),
      name: newTask.name || '',
      description: newTask.description || '',
      startDate: newTask.startDate || new Date(),
      endDate: newTask.endDate || new Date(new Date().setDate(new Date().getDate() + 7)),
      duration: Math.ceil((newTask.endDate?.getTime() || 0) - (newTask.startDate?.getTime() || 0)) / (1000 * 60 * 60 * 24),
      dependencies: newTask.dependencies || [],
      budget: newTask.budget || 0,
      status: newTask.status || TaskStatus.NOT_STARTED
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      dependencies: [],
      budget: 0,
      status: TaskStatus.NOT_STARTED
    });
    setIsAddTaskDialogOpen(false);
  };
  
  // Function to remove a task
  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    // Also remove any rules for this task
    setTaskRules(taskRules.filter(r => r.taskId !== id));
    // And remove this task from dependencies
    setTasks(tasks.map(t => ({
      ...t,
      dependencies: t.dependencies.filter(d => d !== id)
    })));
  };
  
  // Function to add a new rule
  const handleAddRule = () => {
    if (!activeTaskId || !newRule.conditions || newRule.conditions.length === 0) return;
    
    const rule: TaskRule = {
      id: activeRuleId || uuidv4(),
      taskId: activeTaskId,
      conditions: newRule.conditions as Condition[],
      budget: newRule.budget as BudgetRule
    };
    
    if (activeRuleId) {
      // Update existing rule
      setTaskRules(taskRules.map(r => r.id === activeRuleId ? rule : r));
    } else {
      // Add new rule
      setTaskRules([...taskRules, rule]);
    }
    
    setNewRule({
      conditions: [{ 
        id: uuidv4(),
        questionId: '',
        operator: 'equals',
        value: ''
      }],
      budget: {
        type: 'fixed',
        value: 0
      }
    });
    setActiveRuleId(null);
    setActiveTaskId(null);
    setIsAddRuleDialogOpen(false);
  };
  
  // Function to add a condition to a rule
  const handleAddCondition = () => {
    setNewRule({
      ...newRule,
      conditions: [
        ...(newRule.conditions || []),
        {
          id: uuidv4(),
          questionId: '',
          operator: 'equals',
          value: ''
        }
      ]
    });
  };
  
  // Function to update a condition
  const handleConditionChange = (conditionId: string, field: keyof Condition, value: any) => {
    setNewRule({
      ...newRule,
      conditions: (newRule.conditions || []).map(c => 
        c.id === conditionId 
          ? { ...c, [field]: value } 
          : c
      )
    });
  };
  
  // Function to remove a condition
  const handleRemoveCondition = (conditionId: string) => {
    setNewRule({
      ...newRule,
      conditions: (newRule.conditions || []).filter(c => c.id !== conditionId)
    });
  };
  
  // Function to update budget rule
  const handleBudgetRuleChange = (field: keyof BudgetRule, value: any) => {
    setNewRule({
      ...newRule,
      budget: {
        ...(newRule.budget as BudgetRule),
        [field]: value
      }
    });
  };
  
  // Function to edit a rule
  const handleEditRule = (ruleId: string) => {
    const rule = taskRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    setActiveRuleId(rule.id);
    setActiveTaskId(rule.taskId);
    setNewRule({
      conditions: rule.conditions,
      budget: rule.budget
    });
    setIsAddRuleDialogOpen(true);
  };
  
  // Function to remove a rule
  const handleRemoveRule = (ruleId: string) => {
    setTaskRules(taskRules.filter(r => r.id !== ruleId));
  };
  
  // Function to find a question by ID
  const getQuestionById = (id: string): Question | undefined => {
    return questions.find(q => q.id === id);
  };
  
  // Function to find a task by ID
  const getTaskById = (id: string): Task | undefined => {
    return tasks.find(t => t.id === id);
  };
  
  // Function to render input based on question type
  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case QuestionType.TEXT:
        return (
          <Input 
            id={question.id}
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            required={question.required}
          />
        );
      
      case QuestionType.NUMBER:
        return (
          <Input 
            id={question.id}
            type="number"
            min={question.min}
            max={question.max}
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value === '' ? '' : Number(e.target.value))}
            required={question.required}
          />
        );
      
      case QuestionType.SELECT:
        return (
          <Select
            value={responses[question.id] || ''}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <SelectTrigger>
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
      
      case QuestionType.BOOLEAN:
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={question.id}
              checked={responses[question.id] || false}
              onCheckedChange={(checked) => handleResponseChange(question.id, checked)}
            />
            <label
              htmlFor={question.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Yes
            </label>
          </div>
        );
      
      case QuestionType.DATE:
        return (
          <Input 
            id={question.id}
            type="date"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            required={question.required}
          />
        );
      
      case QuestionType.SLIDER:
        return (
          <div className="space-y-4">
            <Slider
              id={question.id}
              min={question.min || 0}
              max={question.max || 100}
              step={question.step || 1}
              value={[responses[question.id] || question.min || 0]}
              onValueChange={(value) => handleResponseChange(question.id, value[0])}
            />
            <p className="text-sm text-right">{responses[question.id] || question.min || 0}</p>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Prepare formatted tasks for Gantt chart
  const formattedTasks = calculateApplicableTasks().map(task => ({
    id: task.id,
    text: task.name,
    start: task.startDate,
    end: task.endDate,
    duration: task.duration,
    progress: task.status === TaskStatus.COMPLETED ? 100 : 
              task.status === TaskStatus.IN_PROGRESS ? 50 : 
              task.status === TaskStatus.ON_HOLD ? 25 : 0,
    budget: calculateTaskBudget(task),
    type: "task"
  }));

  // Format dependencies as links for Gantt chart
  const links = calculateApplicableTasks().flatMap(task => 
    task.dependencies.map(depId => ({
      id: `${depId}-${task.id}`,
      source: depId,
      target: task.id,
      type: "e2e"
    }))
  );

  // Configure time scales for Gantt chart
  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "day", step: 1, format: "d" }
  ];
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card className="w-full shadow-md">
        <CardHeader className="bg-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{templateName}</CardTitle>
              <CardDescription className="text-primary-foreground/80">Create and manage project templates with conditional logic</CardDescription>
            </div>
            <Input
              className="max-w-xs bg-primary-foreground text-primary"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeStep.toString()}
            onValueChange={(value) => setActiveStep(parseInt(value))}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="0">1. Define Questions</TabsTrigger>
              <TabsTrigger value="1">2. Create Tasks & Rules</TabsTrigger>
              <TabsTrigger value="2">3. Results & Budget</TabsTrigger>
            </TabsList>
            
            {/* Step 1: Define Questions */}
            <TabsContent value="0" className="pt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Create Template Questions</h3>
                  <Dialog open={isAddQuestionDialogOpen} onOpenChange={setIsAddQuestionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Question</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="question-text">Question Text</Label>
                          <Input
                            id="question-text"
                            value={newQuestion.text}
                            onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                            placeholder="Enter question text..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="question-type">Question Type</Label>
                          <Select
                            value={newQuestion.type}
                            onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value as QuestionType })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
                              <SelectItem value={QuestionType.NUMBER}>Number</SelectItem>
                              <SelectItem value={QuestionType.SELECT}>Select</SelectItem>
                              <SelectItem value={QuestionType.BOOLEAN}>Yes/No</SelectItem>
                              <SelectItem value={QuestionType.DATE}>Date</SelectItem>
                              <SelectItem value={QuestionType.SLIDER}>Slider</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {(newQuestion.type === QuestionType.NUMBER || newQuestion.type === QuestionType.SLIDER) && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="question-min">Minimum</Label>
                              <Input
                                id="question-min"
                                type="number"
                                value={newQuestion.min || 0}
                                onChange={(e) => setNewQuestion({ ...newQuestion, min: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="question-max">Maximum</Label>
                              <Input
                                id="question-max"
                                type="number"
                                value={newQuestion.max || 100}
                                onChange={(e) => setNewQuestion({ ...newQuestion, max: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                        )}
                        
                        {newQuestion.type === QuestionType.SLIDER && (
                          <div className="space-y-2">
                            <Label htmlFor="question-step">Step</Label>
                            <Input
                              id="question-step"
                              type="number"
                              value={newQuestion.step || 1}
                              onChange={(e) => setNewQuestion({ ...newQuestion, step: parseInt(e.target.value) })}
                            />
                          </div>
                        )}
                        
                        {newQuestion.type === QuestionType.SELECT && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Options</Label>
                              <Button size="sm" variant="outline" onClick={handleAddOption}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Option
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {newQuestion.options?.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveOption(index)}
                                    disabled={newQuestion.options?.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="question-required"
                            checked={newQuestion.required}
                            onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, required: !!checked })}
                          />
                          <label
                            htmlFor="question-required"
                            className="text-sm font-medium leading-none"
                          >
                            Required
                          </label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddQuestionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddQuestion}>
                          <Save className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {questions.length === 0 ? (
                  <div className="text-center py-12 border rounded-md bg-muted/50">
                    <p className="text-muted-foreground">No questions added yet. Click "Add Question" to create your template.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <Card key={question.id} className="shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-md flex items-center gap-2">
                                {index + 1}. {question.text}
                                {question.required && <span className="text-red-500">*</span>}
                              </CardTitle>
                              <CardDescription>
                                Type: {question.type}
                                {question.type === QuestionType.SELECT && ` (${question.options?.length} options)`}
                                {(question.type === QuestionType.NUMBER || question.type === QuestionType.SLIDER) && 
                                  ` (Range: ${question.min || 0} to ${question.max || 100})`}
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => setActiveStep(1)} disabled={questions.length === 0}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
            
            {/* Step 2: Create Tasks & Rules */}
            <TabsContent value="1" className="space-y-6 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Tasks</h3>
                    <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="task-name">Task Name</Label>
                            <Input
                              id="task-name"
                              value={newTask.name}
                              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                              placeholder="Enter task name..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-description">Description</Label>
                            <Input
                              id="task-description"
                              value={newTask.description}
                              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                              placeholder="Enter task description..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="task-start-date">Start Date</Label>
                              <Input
                                id="task-start-date"
                                type="date"
                                value={newTask.startDate?.toISOString().split('T')[0]}
                                onChange={(e) => setNewTask({ 
                                  ...newTask, 
                                  startDate: new Date(e.target.value),
                                  // Recalculate duration
                                  duration: Math.ceil(
                                    (newTask.endDate?.getTime() || 0) - (new Date(e.target.value).getTime() || 0)
                                  ) / (1000 * 60 * 60 * 24)
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="task-end-date">End Date</Label>
                              <Input
                                id="task-end-date"
                                type="date"
                                value={newTask.endDate?.toISOString().split('T')[0]}
                                onChange={(e) => setNewTask({ 
                                  ...newTask, 
                                  endDate: new Date(e.target.value),
                                  // Recalculate duration
                                  duration: Math.ceil(
                                    (new Date(e.target.value).getTime() || 0) - (newTask.startDate?.getTime() || 0)
                                  ) / (1000 * 60 * 60 * 24)
                                })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-budget">Default Budget ($)</Label>
                            <Input
                              id="task-budget"
                              type="number"
                              value={newTask.budget}
                              onChange={(e) => setNewTask({ ...newTask, budget: Number(e.target.value) })}
                              placeholder="0.00"
                            />
                          </div>
                          {tasks.length > 0 && (
                            <div className="space-y-2">
                              <Label>Dependencies</Label>
                              <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                                <div className="space-y-2">
                                  {tasks.map(task => (
                                    <div key={task.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`dep-${task.id}`}
                                        checked={newTask.dependencies?.includes(task.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setNewTask({
                                              ...newTask,
                                              dependencies: [...(newTask.dependencies || []), task.id]
                                            });
                                          } else {
                                            setNewTask({
                                              ...newTask,
                                              dependencies: (newTask.dependencies || []).filter(id => id !== task.id)
                                            });
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`dep-${task.id}`}
                                        className="text-sm leading-none"
                                      >
                                        {task.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddTask}>
                            <Save className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/50">
                      <p className="text-muted-foreground">No tasks added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {tasks.map((task) => (
                        <Card key={task.id} className="shadow-sm">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-md">{task.name}</CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveTaskId(task.id);
                                    setIsAddRuleDialogOpen(true);
                                  }}
                                >
                                  Add Rule
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleRemoveTask(task.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="text-sm space-y-2">
                              <p className="text-muted-foreground">{task.description}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>${task.budget.toLocaleString()}</span>
                                </div>
                              </div>
                              {task.dependencies.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium">Dependencies:</span>{' '}
                                  {task.dependencies.map(depId => {
                                    const depTask = getTaskById(depId);
                                    return depTask ? depTask.name : depId;
                                  }).join(', ')}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Rules Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Conditional Rules</h3>
                  {taskRules.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/50">
                      <p className="text-muted-foreground">
                        No rules defined yet. Select a task and click "Add Rule" to create conditional logic.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {taskRules.map((rule) => {
                        const task = getTaskById(rule.taskId);
                        return (
                          <Card key={rule.id} className="shadow-sm">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-md">
                                    Rule for: {task?.name || 'Unknown Task'}
                                  </CardTitle>
                                  <CardDescription>
                                    {rule.conditions.length} condition(s)
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRule(rule.id)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveRule(rule.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                              <div className="text-sm space-y-3">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Conditions:</h4>
                                  <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                                    {rule.conditions.map((condition) => {
                                      const question = getQuestionById(condition.questionId);
                                      return (
                                        <li key={condition.id}>
                                          {question?.text || 'Unknown Question'}{' '}
                                          <span className="font-medium">
                                            {condition.operator === 'equals' ? 'equals' :
                                             condition.operator === 'not_equals' ? 'does not equal' :
                                             condition.operator === 'greater_than' ? 'is greater than' :
                                             condition.operator === 'less_than' ? 'is less than' :
                                             condition.operator === 'contains' ? 'contains' : condition.operator}
                                          </span>{' '}
                                          {condition.value.toString()}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium">Budget:</h4>
                                  <p className="text-muted-foreground">
                                    {rule.budget.type === 'fixed' ? `Fixed: $${rule.budget.value.toLocaleString()}` :
                                     rule.budget.type === 'per_unit' ? `Per Unit: $${rule.budget.value.toLocaleString()} x ${getQuestionById(rule.budget.unitQuestionId || '')?.text || 'Unknown'}` :
                                     rule.budget.type === 'formula' ? `Formula: ${rule.budget.formula}` : 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add Rule Dialog */}
              <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      {activeRuleId ? 'Edit Rule' : 'Add Rule'} for {getTaskById(activeTaskId || '')?.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Conditions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Conditions</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddCondition}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Condition
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {newRule.conditions?.map((condition) => (
                          <Card key={condition.id} className="shadow-sm">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-5 space-y-2">
                                  <Label>Question</Label>
                                  <Select
                                    value={condition.questionId}
                                    onValueChange={(value) => handleConditionChange(condition.id, 'questionId', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a question" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {questions.map((q) => (
                                        <SelectItem key={q.id} value={q.id}>
                                          {q.text}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-3 space-y-2">
                                  <Label>Operator</Label>
                                  <Select
                                    value={condition.operator}
                                    onValueChange={(value) => handleConditionChange(
                                      condition.id, 
                                      'operator', 
                                      value as 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
                                    )}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="equals">Equals</SelectItem>
                                      <SelectItem value="not_equals">Not equals</SelectItem>
                                      <SelectItem value="greater_than">Greater than</SelectItem>
                                      <SelectItem value="less_than">Less than</SelectItem>
                                      <SelectItem value="contains">Contains</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-3 space-y-2">
                                  <Label>Value</Label>
                                  {condition.questionId && getQuestionById(condition.questionId)?.type === QuestionType.SELECT ? (
                                    <Select
                                      value={condition.value}
                                      onValueChange={(value) => handleConditionChange(condition.id, 'value', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select value" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getQuestionById(condition.questionId)?.options?.map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : condition.questionId && getQuestionById(condition.questionId)?.type === QuestionType.BOOLEAN ? (
                                    <Select
                                      value={condition.value?.toString()}
                                      onValueChange={(value) => handleConditionChange(condition.id, 'value', value === 'true')}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select value" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      type={
                                        condition.questionId && 
                                        getQuestionById(condition.questionId)?.type === QuestionType.NUMBER
                                          ? 'number'
                                          : condition.questionId && 
                                            getQuestionById(condition.questionId)?.type === QuestionType.DATE
                                            ? 'date'
                                            : 'text'
                                      }
                                      value={condition.value}
                                      onChange={(e) => handleConditionChange(condition.id, 'value', e.target.value)}
                                      placeholder="Value"
                                    />
                                  )}
                                </div>
                                <div className="col-span-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveCondition(condition.id)}
                                    disabled={newRule.conditions?.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    {/* Budget Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Budget Calculation</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Budget Type</Label>
                          <Select
                            value={newRule.budget?.type}
                            onValueChange={(value) => handleBudgetRuleChange('type', value as 'fixed' | 'formula' | 'per_unit')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select budget type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                              <SelectItem value="per_unit">Per Unit</SelectItem>
                              <SelectItem value="formula">Formula</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {newRule.budget?.type === 'fixed' && (
                          <div className="space-y-2">
                            <Label htmlFor="budget-value">Amount ($)</Label>
                            <Input
                              id="budget-value"
                              type="number"
                              value={newRule.budget?.value}
                              onChange={(e) => handleBudgetRuleChange('value', Number(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        
                        {newRule.budget?.type === 'per_unit' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="budget-value">Amount per Unit ($)</Label>
                              <Input
                                id="budget-value"
                                type="number"
                                value={newRule.budget?.value}
                                onChange={(e) => handleBudgetRuleChange('value', Number(e.target.value))}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Unit Source Question</Label>
                              <Select
                                value={newRule.budget?.unitQuestionId}
                                onValueChange={(value) => handleBudgetRuleChange('unitQuestionId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select question for units" />
                                </SelectTrigger>
                                <SelectContent>
                                  {questions.filter(q => 
                                    q.type === QuestionType.NUMBER || 
                                    q.type === QuestionType.SLIDER
                                  ).map((q) => (
                                    <SelectItem key={q.id} value={q.id}>
                                      {q.text}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        
                        {newRule.budget?.type === 'formula' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="budget-formula">Formula</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 gap-1"
                                >
                                  <HelpCircle className="h-3 w-3" />
                                  <span className="text-xs">Help</span>
                                </Button>
                              </div>
                              <Input
                                id="budget-formula"
                                value={newRule.budget?.formula || ''}
                                onChange={(e) => handleBudgetRuleChange('formula', e.target.value)}
                                placeholder="e.g. ${questionId1} * 50 + ${questionId2} * 25"
                              />
                              <p className="text-xs text-muted-foreground">
                                Use ${'{questionId}'} to reference question responses. Example: 100 * ${'{questionId}'} + 50
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="budget-value">Default Value ($)</Label>
                              <Input
                                id="budget-value"
                                type="number"
                                value={newRule.budget?.value}
                                onChange={(e) => handleBudgetRuleChange('value', Number(e.target.value))}
                                placeholder="0.00"
                              />
                              <p className="text-xs text-muted-foreground">
                                Used if the formula cannot be calculated
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsAddRuleDialogOpen(false);
                      setActiveTaskId(null);
                      setActiveRuleId(null);
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRule}>
                      <Save className="h-4 w-4 mr-2" />
                      {activeRuleId ? 'Update Rule' : 'Add Rule'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveStep(0)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
                <Button onClick={() => setActiveStep(2)} disabled={tasks.length === 0}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
            
            {/* Step 3: Results & Budget */}
            <TabsContent value="2" className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Preview</CardTitle>
                    <CardDescription>Fill in the form to see the resulting tasks and budget</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {questions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No questions defined yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {questions.map((question) => (
                          <div key={question.id} className="space-y-2">
                            <Label htmlFor={question.id} className="flex items-start gap-1">
                              {question.text}
                              {question.required && <span className="text-red-500">*</span>}
                            </Label>
                            {renderQuestionInput(question)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Summary</CardTitle>
                    <CardDescription>
                      {calculateApplicableTasks().length} tasks apply based on your responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {calculateApplicableTasks().length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          {tasks.length === 0 ? 'No tasks defined yet.' : 'No tasks apply based on current responses.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-muted border-b">
                                <th className="px-4 py-3 text-left">Task</th>
                                <th className="px-4 py-3 text-right">Budget</th>
                              </tr>
                            </thead>
                            <tbody>
                              {calculateApplicableTasks().map((task) => {
                                const taskBudget = calculateTaskBudget(task);
                                return (
                                  <tr key={task.id} className="border-b">
                                    <td className="px-4 py-3">{task.name}</td>
                                    <td className="px-4 py-3 text-right">
                                      ${taskBudget.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-muted font-medium">
                                <td className="px-4 py-3">Total</td>
                                <td className="px-4 py-3 text-right">
                                  ${calculateTotalBudget().toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Gantt Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>
                    {formattedTasks.length} tasks shown in timeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No applicable tasks to display in the timeline.
                      </p>
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <Willow>
                        <Gantt
                          tasks={formattedTasks}
                          links={links}
                          scales={scales}
                          taskContent={(task) => (
                            <div className="flex items-center h-full px-2">
                              <span className="text-sm truncate">{task.text}</span>
                            </div>
                          )}
                          columnContent={(task) => (
                            <div className="flex flex-col px-2 py-1">
                              <span className="text-sm font-medium truncate">{task.text}</span>
                              <span className="text-xs text-muted-foreground">
                                ${task.budget?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        />
                      </Willow>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Step
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Remove custom component implementations as we're using shadcn/ui components

export default ProjectTemplate;
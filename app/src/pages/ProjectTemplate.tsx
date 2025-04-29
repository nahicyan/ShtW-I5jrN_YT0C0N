import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Gantt, Willow } from "wx-react-gantt";
import { 
  Plus, Save, Trash2, ArrowRight, ArrowLeft, Calendar, DollarSign, HelpCircle, 
  FileText, PlusCircle, Clock, BarChart3, CheckCircle, Workflow, AlertCircle 
} from 'lucide-react';
import "wx-react-gantt/dist/gantt.css";
import { formatCurrency } from '@/lib/utils';

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

// Payment due options
enum PaymentDue {
  BEFORE = 'before',
  STARTING = 'starting',
  AFTER = 'after'
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

// Interface for a question set
interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
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
  projectId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  dependencies: string[];
  estimatedBudget: number;
  actualBudget?: number;
  paymentDue: PaymentDue;
  status: TaskStatus;
  variance?: number;
  canOverlap?: boolean;
}

// Interface for a project
interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  templateId?: string;
  questionSetId?: string;
  responses?: Responses;
  estimatedBudget: number;
  actualBudget?: number;
  status: TaskStatus;
}

// Interface for a template
interface Template {
  id: string;
  name: string;
  description?: string;
  questionSetId: string;
  tasks: Task[];
  rules: TaskRule[];
  createdAt: Date;
  updatedAt: Date;
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

// Interface for weekly budget
interface WeeklyBudget {
  weekStart: Date;
  weekEnd: Date;
  projects: {
    id: string;
    name: string;
    estimatedBudget: number;
    actualBudget: number;
    variance: number;
  }[];
  totalEstimated: number;
  totalActual: number;
  totalVariance: number;
}

// ProjectTemplate component
const ProjectTemplate: React.FC = () => {
  // State for main view
  const [activeView, setActiveView] = useState<'dashboard' | 'template' | 'create-project'>('dashboard');
  
  // State for multi-step form
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // State for template name
  const [templateName, setTemplateName] = useState<string>('New Project Template');
  
  // State for questions and question sets
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('projectTemplateQuestions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>(() => {
    const saved = localStorage.getItem('questionSets');
    return saved ? JSON.parse(saved) : [{
      id: uuidv4(),
      name: 'Default Question Set',
      questions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }];
  });
  
  const [activeQuestionSetId, setActiveQuestionSetId] = useState<string | null>(null);
  
  // State for responses
  const [responses, setResponses] = useState<Responses>(() => {
    const saved = localStorage.getItem('projectTemplateResponses');
    return saved ? JSON.parse(saved) : {};
  });
  
  // State for projects
  const [projects, setProjects] = useState<Project[]>([]);
  
  // State for templates
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // State for task rules
  const [taskRules, setTaskRules] = useState<TaskRule[]>(() => {
    const saved = localStorage.getItem('projectTemplateTaskRules');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Weekly budget calculation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  
  const [weeklyBudget, setWeeklyBudget] = useState<WeeklyBudget>({
    weekStart: currentWeekStart,
    weekEnd: new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)),
    projects: [],
    totalEstimated: 0,
    totalActual: 0,
    totalVariance: 0
  });
  
  // State for new project creation
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    startDate: new Date(),
    estimatedBudget: 0,
    status: TaskStatus.NOT_STARTED,
    questionSetId: ''
  });
  
  // State for current active task and rule for editing
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  
  // State for dialogs
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState<boolean>(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState<boolean>(false);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState<boolean>(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState<boolean>(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState<boolean>(false);
  const [isCreateQuestionSetDialogOpen, setIsCreateQuestionSetDialogOpen] = useState<boolean>(false);
  const [isTaskStatusDialogOpen, setIsTaskStatusDialogOpen] = useState<boolean>(false);
  
  // State for new question
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: '',
    type: QuestionType.TEXT,
    required: true,
    options: ['']
  });
  
  // State for new question set
  const [newQuestionSet, setNewQuestionSet] = useState<Partial<QuestionSet>>({
    name: '',
    description: '',
    questions: []
  });
  
  // State for new task
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: '',
    description: '',
    projectId: '',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    dependencies: [],
    estimatedBudget: 0,
    paymentDue: PaymentDue.AFTER,
    status: TaskStatus.NOT_STARTED,
    canOverlap: false
  });
  
  // State for task status update
  const [taskStatusUpdate, setTaskStatusUpdate] = useState<{
    taskId: string;
    status: TaskStatus;
    actualBudget?: number;
  }>({
    taskId: '',
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
    localStorage.setItem('questionSets', JSON.stringify(questionSets));
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [questions, responses, tasks, taskRules, templateName, questionSets, projects, templates]);
  
  // Effect to load template name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('projectTemplateName');
    if (savedName) {
      setTemplateName(savedName);
    }
  }, []);
  
  // Calculate weekly budget
  useEffect(() => {
    // Get all tasks that fall within the current week
    const weekEnd = new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6));
    
    // Group tasks by project
    const projectTasks = tasks.reduce((acc, task) => {
      // Check if task falls within the current week
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      
      const isInWeek = (
        (taskStart >= currentWeekStart && taskStart <= weekEnd) ||
        (taskEnd >= currentWeekStart && taskEnd <= weekEnd) ||
        (taskStart <= currentWeekStart && taskEnd >= weekEnd)
      );
      
      if (isInWeek) {
        if (!acc[task.projectId]) {
          acc[task.projectId] = [];
        }
        
        // Determine if the task budget should be included in this week
        let includeInWeek = false;
        
        switch (task.paymentDue) {
          case PaymentDue.BEFORE:
            // Include if all dependencies are completed
            const allDependenciesCompleted = task.dependencies.every(depId => {
              const depTask = tasks.find(t => t.id === depId);
              return depTask?.status === TaskStatus.COMPLETED;
            });
            includeInWeek = allDependenciesCompleted;
            break;
          case PaymentDue.STARTING:
            // Include if task is in progress
            includeInWeek = task.status === TaskStatus.IN_PROGRESS;
            break;
          case PaymentDue.AFTER:
            // Include if task is completed
            includeInWeek = task.status === TaskStatus.COMPLETED;
            break;
        }
        
        if (includeInWeek) {
          acc[task.projectId].push(task);
        }
      }
      
      return acc;
    }, {} as Record<string, Task[]>);
    
    // Calculate budget for each project
    const projectBudgets = Object.entries(projectTasks).map(([projectId, tasks]) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return null;
      
      const estimatedBudget = tasks.reduce((sum, task) => sum + task.estimatedBudget, 0);
      const actualBudget = tasks.reduce((sum, task) => sum + (task.actualBudget || 0), 0);
      const variance = actualBudget - estimatedBudget;
      
      return {
        id: projectId,
        name: project.name,
        estimatedBudget,
        actualBudget,
        variance
      };
    }).filter(Boolean) as WeeklyBudget['projects'];
    
    // Calculate totals
    const totalEstimated = projectBudgets.reduce((sum, proj) => sum + proj.estimatedBudget, 0);
    const totalActual = projectBudgets.reduce((sum, proj) => sum + proj.actualBudget, 0);
    const totalVariance = totalActual - totalEstimated;
    
    setWeeklyBudget({
      weekStart: currentWeekStart,
      weekEnd,
      projects: projectBudgets,
      totalEstimated,
      totalActual,
      totalVariance
    });
  }, [currentWeekStart, tasks, projects]);
  
  // Function to update task status and collect actual budget if needed
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // If new status is COMPLETED, open dialog to collect actual budget
    if (newStatus === TaskStatus.COMPLETED) {
      setTaskStatusUpdate({
        taskId,
        status: newStatus,
        actualBudget: task.estimatedBudget
      });
      setIsTaskStatusDialogOpen(true);
    } else {
      // Otherwise update status directly
      updateTaskStatus(taskId, newStatus);
    }
  };
  
  // Function to confirm task status update
  const confirmTaskStatusUpdate = () => {
    if (!taskStatusUpdate.taskId) return;
    
    updateTaskStatus(
      taskStatusUpdate.taskId, 
      taskStatusUpdate.status, 
      taskStatusUpdate.actualBudget
    );
    
    setIsTaskStatusDialogOpen(false);
    setTaskStatusUpdate({
      taskId: '',
      status: TaskStatus.NOT_STARTED
    });
  };
  
  // Function to update task status and budget
  const updateTaskStatus = (taskId: string, status: TaskStatus, actualBudget?: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask = { 
          ...task, 
          status, 
          actualBudget: actualBudget !== undefined ? actualBudget : task.actualBudget
        };
        
        // Calculate variance if actual budget is provided
        if (actualBudget !== undefined) {
          updatedTask.variance = actualBudget - task.estimatedBudget;
        }
        
        return updatedTask;
      }
      return task;
    }));
  };
  
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
    if (rules.length === 0) return task.estimatedBudget;
    
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
    
    if (!matchingRule) return task.estimatedBudget;
    
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
    
    // Add to current question set if one is active
    if (activeQuestionSetId) {
      setQuestionSets(questionSets.map(qs => {
        if (qs.id === activeQuestionSetId) {
          return {
            ...qs,
            questions: [...qs.questions, question],
            updatedAt: new Date()
          };
        }
        return qs;
      }));
    }
    
    setNewQuestion({
      text: '',
      type: QuestionType.TEXT,
      required: true,
      options: ['']
    });
    setIsAddQuestionDialogOpen(false);
  };
  
  // Function to add a new question set
  const handleAddQuestionSet = () => {
    if (!newQuestionSet.name) return;
    
    const questionSet: QuestionSet = {
      id: uuidv4(),
      name: newQuestionSet.name,
      description: newQuestionSet.description || '',
      questions: newQuestionSet.questions || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setQuestionSets([...questionSets, questionSet]);
    setActiveQuestionSetId(questionSet.id);
    
    setNewQuestionSet({
      name: '',
      description: '',
      questions: []
    });
    
    setIsCreateQuestionSetDialogOpen(false);
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
    
    // Remove from question sets
    setQuestionSets(questionSets.map(qs => {
      return {
        ...qs,
        questions: qs.questions.filter(q => q.id !== id),
        updatedAt: new Date()
      };
    }));
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
      projectId: newTask.projectId || '',
      startDate: newTask.startDate || new Date(),
      endDate: newTask.endDate || new Date(new Date().setDate(new Date().getDate() + 7)),
      duration: Math.ceil((newTask.endDate?.getTime() || 0) - (newTask.startDate?.getTime() || 0)) / (1000 * 60 * 60 * 24),
      dependencies: newTask.dependencies || [],
      estimatedBudget: newTask.estimatedBudget || 0,
      paymentDue: newTask.paymentDue || PaymentDue.AFTER,
      status: newTask.status || TaskStatus.NOT_STARTED,
      canOverlap: newTask.canOverlap || false
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      name: '',
      description: '',
      projectId: '',
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      dependencies: [],
      estimatedBudget: 0,
      paymentDue: PaymentDue.AFTER,
      status: TaskStatus.NOT_STARTED,
      canOverlap: false
    });
    setIsAddTaskDialogOpen(false);
  };
  
  // Function to create a new project
  const handleCreateProject = () => {
    if (!newProject.name || !newProject.startDate) return;
    
    const project: Project = {
      id: uuidv4(),
      name: newProject.name,
      description: newProject.description,
      startDate: newProject.startDate,
      templateId: newProject.templateId,
      questionSetId: newProject.questionSetId,
      responses: responses,
      estimatedBudget: newProject.estimatedBudget || 0,
      status: TaskStatus.NOT_STARTED
    };
    
    setProjects([...projects, project]);
    
    // If there's a template, create tasks from it
    if (newProject.templateId) {
      const template = templates.find(t => t.id === newProject.templateId);
      if (template) {
        // Create tasks based on template and responses
        const templateTasks = template.tasks.map(task => {
          const startDate = new Date(newProject.startDate!);
          startDate.setDate(startDate.getDate() + task.duration);
          
          return {
            ...task,
            id: uuidv4(),
            projectId: project.id,
            startDate: newProject.startDate,
            endDate: startDate,
            status: TaskStatus.NOT_STARTED,
            // Apply rules to calculate estimated budget
            estimatedBudget: calculateTaskBudget(task)
          };
        });
        
        setTasks([...tasks, ...templateTasks]);
      }
    }
    
    setNewProject({
      name: '',
      description: '',
      startDate: new Date(),
      estimatedBudget: 0,
      status: TaskStatus.NOT_STARTED,
      questionSetId: ''
    });
    
    setResponses({});
    setIsCreateProjectDialogOpen(false);
    setActiveView('dashboard');
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
  
  // Function to save template
  const handleSaveTemplate = () => {
    const template: Template = {
      id: activeTemplateId || uuidv4(),
      name: templateName,
      description: 'Template created on ' + new Date().toLocaleDateString(),
      questionSetId: activeQuestionSetId || questionSets[0].id,
      tasks: calculateApplicableTasks(),
      rules: taskRules,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (activeTemplateId) {
      // Update existing template
      setTemplates(templates.map(t => t.id === activeTemplateId ? template : t));
    } else {
      // Add new template
      setTemplates([...templates, template]);
    }
    
    setActiveTemplateId(null);
    setActiveView('dashboard');
  };
  
  // Function to remove a rule
  const handleRemoveRule = (ruleId: string) => {
    setTaskRules(taskRules.filter(r => r.id !== ruleId));
  };
  
  // Function to remove a project
  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    // Also remove tasks associated with this project
    setTasks(tasks.filter(t => t.projectId !== id));
  };
  
  // Function to find a question by ID
  const getQuestionById = (id: string): Question | undefined => {
    return questions.find(q => q.id === id);
  };
  
  // Function to find a task by ID
  const getTaskById = (id: string): Task | undefined => {
    return tasks.find(t => t.id === id);
  };
  
  // Function to find a project by ID
  const getProjectById = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };
  
  // Function to navigate to previous week
  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };
  
  // Function to navigate to next week
  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };
  
  // Function to format date range for display
  const formatDateRange = (start: Date, end: Date): string => {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };
  
  // Function to get questions from a question set
  const getQuestionsFromSet = (questionSetId: string): Question[] => {
    const set = questionSets.find(qs => qs.id === questionSetId);
    return set ? set.questions : [];
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
                <SelectItem key={index} value={option || 'option-placeholder'}>
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
  
  // Prepare formatted tasks for Gantt chart based on view
  const getFormattedTasks = () => {
    let tasksToFormat: Task[] = [];
    
    if (activeView === 'dashboard') {
      // Show all tasks for all projects
      tasksToFormat = tasks;
    } else if (activeView === 'template') {
      // Show only applicable tasks based on template responses
      tasksToFormat = calculateApplicableTasks();
    } else if (activeProjectId) {
      // Show tasks for the active project
      tasksToFormat = tasks.filter(task => task.projectId === activeProjectId);
    }
    
    return tasksToFormat.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      
      return {
        id: task.id,
        text: task.name,
        start: task.startDate,
        end: task.endDate,
        duration: task.duration,
        progress: task.status === TaskStatus.COMPLETED ? 100 : 
                task.status === TaskStatus.IN_PROGRESS ? 50 : 
                task.status === TaskStatus.ON_HOLD ? 25 : 0,
        budget: task.estimatedBudget,
        actualBudget: task.actualBudget,
        variance: task.variance,
        status: task.status,
        paymentDue: task.paymentDue,
        project: project?.name || 'Unknown Project',
        type: "task"
      };
    });
  };

  // Format dependencies as links for Gantt chart
  const getFormattedLinks = () => {
    let tasksToFormat: Task[] = [];
    
    if (activeView === 'dashboard') {
      tasksToFormat = tasks;
    } else if (activeView === 'template') {
      tasksToFormat = calculateApplicableTasks();
    } else if (activeProjectId) {
      tasksToFormat = tasks.filter(task => task.projectId === activeProjectId);
    }
    
    return tasksToFormat.flatMap(task => 
      task.dependencies.map(depId => ({
        id: `${depId}-${task.id}`,
        source: depId,
        target: task.id,
        type: "e2e"
      }))
    );
  };

  // Configure time scales for Gantt chart
  const scales = [
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "day", step: 1, format: "d" }
  ];
  
  // Render Dashboard View
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Construction Project Dashboard</h2>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateProjectDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Project
            </Button>
            <Button onClick={() => setActiveView('template')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Create Template
            </Button>
            <Button onClick={() => setIsCreateQuestionSetDialogOpen(true)} variant="outline">
              <HelpCircle className="h-4 w-4 mr-2" />
              Create Question Set
            </Button>
          </div>
        </div>
        
        {/* Weekly Budget Overview */}
        <Card>
          <CardHeader className="bg-primary text-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Weekly Budget</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {formatDateRange(weeklyBudget.weekStart, weeklyBudget.weekEnd)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white" onClick={handlePreviousWeek}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white" onClick={handleNextWeek}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Project</th>
                    <th className="px-4 py-2 text-right">Estimated Budget</th>
                    <th className="px-4 py-2 text-right">Actual Cost</th>
                    <th className="px-4 py-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyBudget.projects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        No budget entries for this week
                      </td>
                    </tr>
                  ) : (
                    weeklyBudget.projects.map(project => (
                      <tr key={project.id} className="border-b">
                        <td className="px-4 py-3">{project.name}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(project.estimatedBudget)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(project.actualBudget)}</td>
                        <td className={`px-4 py-3 text-right ${project.variance > 0 ? 'text-red-500' : project.variance < 0 ? 'text-green-500' : ''}`}>
                          {project.variance > 0 ? '+' : ''}{formatCurrency(project.variance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-medium">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(weeklyBudget.totalEstimated)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(weeklyBudget.totalActual)}</td>
                    <td className={`px-4 py-3 text-right ${weeklyBudget.totalVariance > 0 ? 'text-red-500' : weeklyBudget.totalVariance < 0 ? 'text-green-500' : ''}`}>
                      {weeklyBudget.totalVariance > 0 ? '+' : ''}{formatCurrency(weeklyBudget.totalVariance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Project Gantt Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>All active projects and tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <Willow>
                <Gantt
                  tasks={getFormattedTasks()}
                  links={getFormattedLinks()}
                  scales={scales}
                  taskContent={(task) => (
                    <div className="flex items-center justify-between h-full px-2 w-full">
                      <span className="text-sm truncate">{task.text}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                        task.status === TaskStatus.ON_HOLD ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === TaskStatus.COMPLETED ? 'Done' :
                         task.status === TaskStatus.IN_PROGRESS ? 'In Progress' :
                         task.status === TaskStatus.ON_HOLD ? 'On Hold' :
                         'Not Started'}
                      </span>
                    </div>
                  )}
                  columnContent={(task) => (
                    <div className="flex flex-col px-2 py-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium truncate">{task.text}</span>
                        <span className="text-xs text-muted-foreground">{task.project}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          Est: {formatCurrency(task.budget)}
                        </span>
                        {task.actualBudget !== undefined && (
                          <span className={`text-xs ${
                            (task.variance || 0) > 0 ? 'text-red-500' : 
                            (task.variance || 0) < 0 ? 'text-green-500' : ''
                          }`}>
                            Act: {formatCurrency(task.actualBudget)}
                            {(task.variance || 0) !== 0 && (
                              <span> ({(task.variance || 0) > 0 ? '+' : ''}{formatCurrency(task.variance || 0)})</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex mt-1 items-center text-xs">
                        <span className="mr-2">Payment: </span>
                        <span className={`px-1.5 py-0.5 rounded-full ${
                          task.paymentDue === PaymentDue.BEFORE ? 'bg-purple-100 text-purple-800' :
                          task.paymentDue === PaymentDue.STARTING ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.paymentDue === PaymentDue.BEFORE ? 'Before' :
                           task.paymentDue === PaymentDue.STARTING ? 'Starting' :
                           'After'}
                        </span>
                      </div>
                    </div>
                  )}
                  contextMenu={(task) => (
                    <div className="flex flex-col bg-white rounded-lg shadow-lg text-sm overflow-hidden min-w-32">
                      <Button variant="ghost" className="justify-start px-4 py-2 rounded-none text-left" 
                        onClick={() => handleUpdateTaskStatus(task.id, TaskStatus.NOT_STARTED)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Not Started
                      </Button>
                      <Button variant="ghost" className="justify-start px-4 py-2 rounded-none text-left"
                        onClick={() => handleUpdateTaskStatus(task.id, TaskStatus.IN_PROGRESS)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        In Progress
                      </Button>
                      <Button variant="ghost" className="justify-start px-4 py-2 rounded-none text-left"
                        onClick={() => handleUpdateTaskStatus(task.id, TaskStatus.COMPLETED)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                      </Button>
                      <Button variant="ghost" className="justify-start px-4 py-2 rounded-none text-left"
                        onClick={() => handleUpdateTaskStatus(task.id, TaskStatus.ON_HOLD)}>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        On Hold
                      </Button>
                    </div>
                  )}
                />
              </Willow>
            </div>
          </CardContent>
        </Card>
        
        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Manage your construction projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12 border rounded-md bg-muted/50">
                <p className="text-muted-foreground">No projects added yet. Click "Create Project" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map(project => (
                  <Card key={project.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md">{project.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProject(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="text-sm space-y-2">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Start: {project.startDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Budget: {formatCurrency(project.estimatedBudget)}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                            project.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                            project.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                            project.status === TaskStatus.ON_HOLD ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <span>
                              {project.status === TaskStatus.COMPLETED ? 'Completed' :
                               project.status === TaskStatus.IN_PROGRESS ? 'In Progress' :
                               project.status === TaskStatus.ON_HOLD ? 'On Hold' :
                               'Not Started'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Main render function
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Main Content */}
      {activeView === 'dashboard' && renderDashboard()}
      
      {activeView === 'template' && (
        <Card className="w-full shadow-md">
          <CardHeader className="bg-primary text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{templateName}</CardTitle>
                <CardDescription className="text-primary-foreground/80">Create and manage project templates with conditional logic</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  className="max-w-xs bg-primary-foreground text-primary"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template Name"
                />
                <Button 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setActiveView('dashboard')}
                >
                  Cancel
                </Button>
              </div>
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
                    <div className="flex gap-4 items-center">
                      <h3 className="text-lg font-medium">Create Template Questions</h3>
                      
                      <Select 
                        value={activeQuestionSetId || ''} 
                        onValueChange={(value) => setActiveQuestionSetId(value || null)}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select a question set" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionSets.map((set) => (
                            <SelectItem key={set.id} value={set.id}>
                              {set.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
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
                          <DialogDescription>
                            Create a new question for your template
                          </DialogDescription>
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
                  
                  {/* Create Question Set Dialog */}
                  <Dialog open={isCreateQuestionSetDialogOpen} onOpenChange={setIsCreateQuestionSetDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Question Set</DialogTitle>
                        <DialogDescription>
                          Create a reusable group of questions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="question-set-name">Name</Label>
                          <Input
                            id="question-set-name"
                            value={newQuestionSet.name}
                            onChange={(e) => setNewQuestionSet({ ...newQuestionSet, name: e.target.value })}
                            placeholder="Enter question set name..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="question-set-description">Description</Label>
                          <Input
                            id="question-set-description"
                            value={newQuestionSet.description}
                            onChange={(e) => setNewQuestionSet({ ...newQuestionSet, description: e.target.value })}
                            placeholder="Enter a description..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateQuestionSetDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddQuestionSet}>
                          <Save className="h-4 w-4 mr-2" />
                          Create Question Set
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Question List */}
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
                            <DialogDescription>
                              Create a new task for your project template
                            </DialogDescription>
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
                              <Label htmlFor="task-budget">Estimated Budget ($)</Label>
                              <Input
                                id="task-budget"
                                type="number"
                                value={newTask.estimatedBudget}
                                onChange={(e) => setNewTask({ ...newTask, estimatedBudget: Number(e.target.value) })}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="task-payment-due">Payment Due</Label>
                              <Select
                                value={newTask.paymentDue}
                                onValueChange={(value) => setNewTask({ ...newTask, paymentDue: value as PaymentDue })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select when payment is due" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={PaymentDue.BEFORE}>Before (When dependencies are met)</SelectItem>
                                  <SelectItem value={PaymentDue.STARTING}>Starting (When task begins)</SelectItem>
                                  <SelectItem value={PaymentDue.AFTER}>After (When task is completed)</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                This determines when the budget will be allocated in weekly reports
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="task-can-overlap"
                                checked={newTask.canOverlap}
                                onCheckedChange={(checked) => setNewTask({ ...newTask, canOverlap: !!checked })}
                              />
                              <label
                                htmlFor="task-can-overlap"
                                className="text-sm font-medium leading-none"
                              >
                                Can overlap with other tasks
                              </label>
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
                                    <span>${task.estimatedBudget.toLocaleString()}</span>
                                  </div>
                                  <div className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                                    task.paymentDue === PaymentDue.BEFORE ? 'bg-purple-100 text-purple-800' :
                                    task.paymentDue === PaymentDue.STARTING ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    <span>
                                      Payment: 
                                      {task.paymentDue === PaymentDue.BEFORE ? ' Before' :
                                       task.paymentDue === PaymentDue.STARTING ? ' Starting' :
                                       ' After'}
                                    </span>
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
                                {!task.canOverlap && (
                                  <div className="text-xs flex items-center gap-1">
                                    <Workflow className="h-3 w-3" />
                                    <span>Cannot overlap with other tasks</span>
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
                      <DialogDescription>
                        Define conditions that determine when this task applies
                      </DialogDescription>
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
                                            <SelectItem key={option} value={option || 'option-placeholder'}>
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
                      {getFormattedTasks().length} tasks shown in timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getFormattedTasks().length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          No applicable tasks to display in the timeline.
                        </p>
                      </div>
                    ) : (
                      <div className="h-[400px]">
                        <Willow>
                          <Gantt
                            tasks={getFormattedTasks()}
                            links={getFormattedLinks()}
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
                  <Button onClick={handleSaveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Create Project Dialog */}
      <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Fill in the project details to get started
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-start-date">Start Date</Label>
                  <Input
                    id="project-start-date"
                    type="date"
                    value={newProject.startDate?.toISOString().split('T')[0]}
                    onChange={(e) => setNewProject({ ...newProject, startDate: new Date(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Input
                  id="project-description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-budget">Estimated Budget ($)</Label>
                <Input
                  id="project-budget"
                  type="number"
                  value={newProject.estimatedBudget}
                  onChange={(e) => setNewProject({ ...newProject, estimatedBudget: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <Select
                  value={newProject.templateId || 'no-template'}
                  onValueChange={(value) => {
                    const templateValue = value === 'no-template' ? '' : value;
                    const template = templates.find(t => t.id === templateValue);
                    if (template) {
                      setNewProject({ 
                        ...newProject, 
                        templateId: templateValue,
                        questionSetId: template.questionSetId
                      });
                      setActiveQuestionSetId(template.questionSetId);
                    } else {
                      setNewProject({ 
                        ...newProject, 
                        templateId: templateValue 
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-template">No Template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Question Set</Label>
                <Select
                  value={newProject.questionSetId || 'select-question-set'}
                  onValueChange={(value) => {
                    const setId = value === 'select-question-set' ? '' : value;
                    setNewProject({ ...newProject, questionSetId: setId });
                    setActiveQuestionSetId(setId);
                  }}
                  disabled={!!newProject.templateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a question set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select-question-set">Select a question set</SelectItem>
                    {questionSets.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {newProject.questionSetId && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Project Questions</h3>
                <div className="space-y-6">
                  {getQuestionsFromSet(newProject.questionSetId).map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={question.id} className="flex items-start gap-1">
                        {question.text}
                        {question.required && <span className="text-red-500">*</span>}
                      </Label>
                      {renderQuestionInput(question)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              <Save className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Task Status Update Dialog */}
      <Dialog open={isTaskStatusDialogOpen} onOpenChange={setIsTaskStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Enter the actual cost for the completed task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {taskStatusUpdate.status === TaskStatus.COMPLETED && (
              <div className="space-y-2">
                <Label htmlFor="actual-budget">Actual Cost ($)</Label>
                <Input
                  id="actual-budget"
                  type="number"
                  value={taskStatusUpdate.actualBudget || 0}
                  onChange={(e) => setTaskStatusUpdate({
                    ...taskStatusUpdate,
                    actualBudget: Number(e.target.value)
                  })}
                  placeholder="0.00"
                />
                {taskStatusUpdate.actualBudget !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated: ${getTaskById(taskStatusUpdate.taskId)?.estimatedBudget.toLocaleString()}</span>
                    <span className={`${
                      (taskStatusUpdate.actualBudget - (getTaskById(taskStatusUpdate.taskId)?.estimatedBudget || 0)) > 0 
                        ? 'text-red-500' 
                        : (taskStatusUpdate.actualBudget - (getTaskById(taskStatusUpdate.taskId)?.estimatedBudget || 0)) < 0
                          ? 'text-green-500'
                          : ''
                    }`}>
                      Variance: ${(taskStatusUpdate.actualBudget - (getTaskById(taskStatusUpdate.taskId)?.estimatedBudget || 0)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmTaskStatusUpdate}>
              <Save className="h-4 w-4 mr-2" />
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectTemplate;
export enum DurationType {
    FROM_PROJECT_START = 'from_project_start',
    FROM_PREVIOUS_TASK = 'from_previous_task'
  }
  
  export enum ConditionOperator {
    EQUALS = 'equals',
    NOT_EQUALS = 'not_equals',
    GREATER_THAN = 'greater_than',
    LESS_THAN = 'less_than',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'not_contains'
  }
  
  export enum ConditionAction {
    SHOW = 'show',
    HIDE = 'hide'
  }
  
  export enum BudgetAdjustmentType {
    FIXED = 'fixed',
    PER_UNIT = 'per_unit',
    FORMULA = 'formula'
  }
  
  export interface DisplayCondition {
    questionId: string;
    operator: ConditionOperator;
    value: any;
    action: ConditionAction;
  }
  
  export interface BudgetAdjustment {
    questionId: string;
    operator: ConditionOperator;
    value: any;
    adjustmentType: BudgetAdjustmentType;
    amount: string | number;
  }
  
  export interface TaskTemplate {
    _id: string;
    name: string;
    description?: string;
    duration: number;
    durationType: DurationType;
    displayConditions: DisplayCondition[];
    budgetAdjustments: BudgetAdjustment[];
    estimatedBudget: number;
    dependencies: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export type TaskTemplateFormData = Omit<TaskTemplate, '_id' | 'createdAt' | 'updatedAt'>;
  
  export interface TaskTemplatesResponse {
    success: boolean;
    count: number;
    data: TaskTemplate[];
  }
  
  export interface TaskTemplateResponse {
    success: boolean;
    data: TaskTemplate;
  }
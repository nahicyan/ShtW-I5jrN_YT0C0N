export enum BudgetEntryType {
    FORECAST = 'forecast',
    ACTUAL = 'actual',
  }
  
  export interface BudgetEntry {
    _id: string;
    projectId: string;
    taskId?: string;
    description: string;
    amount: number;
    type: BudgetEntryType;
    weekStart: string; // ISO string format
    weekEnd: string; // ISO string format
    createdAt: string;
    updatedAt: string;
  }
  
  export type BudgetEntryFormData = Omit<
    BudgetEntry,
    '_id' | 'createdAt' | 'updatedAt' | 'weekEnd'
  >;
  
  export interface BudgetsResponse {
    success: boolean;
    count: number;
    data: BudgetEntry[];
  }
  
  export interface BudgetResponse {
    success: boolean;
    data: BudgetEntry;
  }
  
  export interface BudgetSummaryItem {
    _id: string;
    projectName: string;
    forecast: number;
    actual: number;
  }
  
  export interface BudgetSummaryResponse {
    success: boolean;
    weekStart: string;
    weekEnd: string;
    data: BudgetSummaryItem[];
    totals: {
      forecast: number;
      actual: number;
    };
  }
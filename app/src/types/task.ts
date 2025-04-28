export enum TaskStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    ON_HOLD = 'on_hold',
  }
  
  export interface Task {
    _id: string;
    name: string;
    description?: string;
    projectId: string;
    startDate: string; // ISO string format
    endDate: string; // ISO string format
    actualStartDate?: string; // ISO string format
    actualEndDate?: string; // ISO string format
    estimatedBudget: number;
    actualCost?: number;
    status: TaskStatus;
    dependencies: string[];
    createdAt: string;
    updatedAt: string;
    duration?: number; // Virtual property
  }
  
  export type TaskFormData = Omit<
    Task,
    '_id' | 'createdAt' | 'updatedAt' | 'duration'
  >;
  
  export interface TasksResponse {
    success: boolean;
    count: number;
    data: Task[];
  }
  
  export interface TaskResponse {
    success: boolean;
    data: Task;
  }
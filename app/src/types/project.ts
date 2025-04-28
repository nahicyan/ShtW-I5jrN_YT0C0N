export enum ProjectStatus {
    PLANNING = 'planning',
    IN_PROGRESS = 'in_progress',
    ON_HOLD = 'on_hold',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
  }
  
  export interface Project {
    _id: string;
    name: string;
    description?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    location: string;
    squareFootage: number;
    estimatedBudget: number;
    actualBudget?: number;
    status: ProjectStatus;
    startDate: string; // ISO string format
    estimatedEndDate: string; // ISO string format
    actualEndDate?: string; // ISO string format
    createdAt: string;
    updatedAt: string;
    estimatedDuration?: number; // Virtual property
  }
  
  export type ProjectFormData = Omit<
    Project,
    '_id' | 'createdAt' | 'updatedAt' | 'estimatedDuration'
  >;
  
  export interface ProjectsResponse {
    success: boolean;
    count: number;
    data: Project[];
  }
  
  export interface ProjectResponse {
    success: boolean;
    data: Project;
  }
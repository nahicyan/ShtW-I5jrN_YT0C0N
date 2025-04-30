import { TaskTemplate } from './taskTemplate';

export interface TaskSet {
  _id: string;
  name: string;
  description?: string;
  taskTemplates: TaskTemplate[] | string[];
  createdAt: string;
  updatedAt: string;
}

export type TaskSetFormData = Omit
  TaskSet,
  '_id' | 'createdAt' | 'updatedAt' | 'taskTemplates'
> & {
  taskTemplates: string[];
};

export interface TaskSetsResponse {
  success: boolean;
  count: number;
  data: TaskSet[];
}

export interface TaskSetResponse {
  success: boolean;
  data: TaskSet;
}
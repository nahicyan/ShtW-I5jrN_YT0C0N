// app/src/types/projectTemplate.ts
import { Questionnaire } from './questionnaire';
import { TaskSet } from './taskSet';

export interface ProjectTemplate {
  _id: string;
  name: string;
  description?: string;
  questionnaireId: string | Questionnaire;
  taskSetId: string | TaskSet;
  createdAt: string;
  updatedAt: string;
}

export type ProjectTemplateFormData = Omit<ProjectTemplate, '_id' | 'createdAt' | 'updatedAt'> & {
  questionnaireId: string;
  taskSetId: string;
};

export interface ProjectTemplatesResponse {
  success: boolean;
  count: number;
  data: ProjectTemplate[];
}

export interface ProjectTemplateResponse {
  success: boolean;
  data: ProjectTemplate;
}
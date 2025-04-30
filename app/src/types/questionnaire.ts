export enum QuestionType {
    TEXT = 'text',
    NUMBER = 'number',
    RANGE = 'range',
    SELECT = 'select',
    MULTISELECT = 'multiselect',
    DATE = 'date',
    BOOLEAN = 'boolean'
  }
  
  export interface Question {
    _id: string;
    text: string;
    answerType: QuestionType;
    isRequired: boolean;
    options?: string[];
    minValue?: number;
    maxValue?: number;
    defaultValue?: string | number | boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export type QuestionFormData = Omit<Question, '_id' | 'createdAt' | 'updatedAt'>;
  
  export interface QuestionsResponse {
    success: boolean;
    count: number;
    data: Question[];
  }
  
  export interface QuestionResponse {
    success: boolean;
    data: Question;
  }
  
  export interface Questionnaire {
    _id: string;
    name: string;
    description?: string;
    questions: Question[] | string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export type QuestionnaireFormData = Omit<Questionnaire, '_id' | 'createdAt' | 'updatedAt' | 'questions'> & {
    questions: string[];
  };
  
  export interface QuestionnairesResponse {
    success: boolean;
    count: number;
    data: Questionnaire[];
  }
  
  export interface QuestionnaireResponse {
    success: boolean;
    data: Questionnaire;
  }
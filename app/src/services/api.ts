import axios from 'axios';
import { Project, ProjectFormData, ProjectResponse, ProjectsResponse } from '../types/project';
import { Task, TaskFormData, TaskResponse, TasksResponse } from '../types/task';
import { BudgetEntry, BudgetEntryFormData, BudgetResponse, BudgetsResponse, BudgetSummaryResponse, DashboardWeeklyResponse, } from '../types/budget';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Project API services
export const projectService = {
  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<ProjectsResponse>('/projects');
    return response.data.data;
  },

  // Get project by ID
  getProject: async (id: string): Promise<Project> => {
    const response = await api.get<ProjectResponse>(`/projects/${id}`);
    return response.data.data;
  },

  // Create new project
  createProject: async (project: ProjectFormData): Promise<Project> => {
    const response = await api.post<ProjectResponse>('/projects', project);
    return response.data.data;
  },

  // Update project
  updateProject: async (id: string, project: Partial<ProjectFormData>): Promise<Project> => {
    const response = await api.put<ProjectResponse>(`/projects/${id}`, project);
    return response.data.data;
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Get projects by status
  getProjectsByStatus: async (status: string): Promise<Project[]> => {
    const response = await api.get<ProjectsResponse>(`/projects/status/${status}`);
    return response.data.data;
  },
};

// Task API services
export const taskService = {
  // Get all tasks
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<TasksResponse>('/tasks');
    return response.data.data;
  },

  // Get task by ID
  getTask: async (id: string): Promise<Task> => {
    const response = await api.get<TaskResponse>(`/tasks/${id}`);
    return response.data.data;
  },

  // Create new task
  createTask: async (task: TaskFormData): Promise<Task> => {
    const response = await api.post<TaskResponse>('/tasks', task);
    return response.data.data;
  },

  // Update task
  updateTask: async (id: string, task: Partial<TaskFormData>): Promise<Task> => {
    const response = await api.put<TaskResponse>(`/tasks/${id}`, task);
    return response.data.data;
  },

  // Delete task
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Get tasks by project
  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    const response = await api.get<TasksResponse>(`/tasks/project/${projectId}`);
    return response.data.data;
  },

  // Get tasks by status
  getTasksByStatus: async (status: string): Promise<Task[]> => {
    const response = await api.get<TasksResponse>(`/tasks/status/${status}`);
    return response.data.data;
  },
};

// Budget API services
export const budgetService = {
  // Get all budget entries
  getBudgetEntries: async (filters?: { projectId?: string; weekStart?: string; type?: string }): Promise<BudgetEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.weekStart) params.append('weekStart', filters.weekStart);
    if (filters?.type) params.append('type', filters.type);
    
    const response = await api.get<BudgetsResponse>(`/budgets?${params.toString()}`);
    return response.data.data;
  },

  // Get budget entry by ID
  getBudgetEntry: async (id: string): Promise<BudgetEntry> => {
    const response = await api.get<BudgetResponse>(`/budgets/${id}`);
    return response.data.data;
  },

  // Create new budget entry
  createBudgetEntry: async (budget: BudgetEntryFormData): Promise<BudgetEntry> => {
    const response = await api.post<BudgetResponse>('/budgets', budget);
    return response.data.data;
  },

  // Update budget entry
  updateBudgetEntry: async (id: string, budget: Partial<BudgetEntryFormData>): Promise<BudgetEntry> => {
    const response = await api.put<BudgetResponse>(`/budgets/${id}`, budget);
    return response.data.data;
  },

  // Delete budget entry
  deleteBudgetEntry: async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },

  // Get weekly budget summary
  getBudgetSummary: async (weekStart: string): Promise<BudgetSummaryResponse> => {
    const response = await api.get<BudgetSummaryResponse>(`/budgets/summary?weekStart=${weekStart}`);
    return response.data;
  },

  // Get dashboard weekly data
  getDashboardWeekly: async (weekStart: string): Promise<DashboardWeeklyResponse> => {
    const response = await api.get<DashboardWeeklyResponse>(`/budgets/dashboard/weekly?weekStart=${weekStart}`);
    return response.data;
  }
};

export default api;
import axios from 'axios';
import { Project, ProjectFormData, ProjectResponse, ProjectsResponse } from '../types/project';
import { Task, TaskFormData, TaskResponse, TasksResponse } from '../types/task';

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

export default api;
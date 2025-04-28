import { Request, Response } from 'express';
import Task, { ITask, TaskStatus } from '../models/Task';
import mongoose from 'mongoose';

// Helper function to check for circular dependencies
const hasCircularDependency = async (
  taskId: string,
  dependencyId: string
): Promise<boolean> => {
  // If the dependency itself depends on the task, it's circular
  if (taskId === dependencyId) return true;

  const dependency = await Task.findById(dependencyId);
  if (!dependency) return false;

  // Check if any of the dependency's dependencies create a circular reference
  for (const depId of dependency.dependencies) {
    const isCircular = await hasCircularDependency(taskId, depId.toString());
    if (isCircular) return true;
  }

  return false;
};

// Get all tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get tasks by project
export const getTasksByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format',
      });
    }
    
    const tasks = await Task.find({ projectId }).sort({ startDate: 1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single task
export const getTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new task
export const createTask = async (req: Request, res: Response) => {
  try {
    const taskData = req.body;
    
    // Check for circular dependencies
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      for (const dependencyId of taskData.dependencies) {
        if (!mongoose.Types.ObjectId.isValid(dependencyId)) {
          return res.status(400).json({
            success: false,
            error: `Invalid dependency ID format: ${dependencyId}`,
          });
        }
        
        // Since we're creating a new task, we pass a temporary ID
        const tempId = new mongoose.Types.ObjectId().toString();
        const isCircular = await hasCircularDependency(tempId, dependencyId);
        
        if (isCircular) {
          return res.status(400).json({
            success: false,
            error: 'Circular dependency detected',
          });
        }
      }
    }
    
    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      return res.status(400).json({
        success: false,
        error: messages,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    
    // Check for circular dependencies
    if (updates.dependencies && updates.dependencies.length > 0) {
      for (const dependencyId of updates.dependencies) {
        if (!mongoose.Types.ObjectId.isValid(dependencyId)) {
          return res.status(400).json({
            success: false,
            error: `Invalid dependency ID format: ${dependencyId}`,
          });
        }
        
        const isCircular = await hasCircularDependency(taskId, dependencyId);
        
        if (isCircular) {
          return res.status(400).json({
            success: false,
            error: 'Circular dependency detected',
          });
        }
      }
    }

    const task = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      return res.status(400).json({
        success: false,
        error: messages,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }
    
    // Check if this task is a dependency for other tasks
    const dependentTasks = await Task.find({ 
      dependencies: req.params.id 
    });
    
    if (dependentTasks.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete task as it is a dependency for other tasks',
        dependentTasks: dependentTasks.map(t => ({ id: t._id, name: t.name })),
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get tasks by status
export const getTasksByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    
    // Validate status
    if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }
    
    const tasks = await Task.find({ status }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
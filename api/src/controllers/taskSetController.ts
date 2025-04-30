import { Request, Response } from 'express';
import TaskSet, { ITaskSet } from '../models/TaskSet';
import mongoose from 'mongoose';

// Get all task sets
export const getTaskSets = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskSets = await TaskSet.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: taskSets.length,
      data: taskSets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single task set with task templates
export const getTaskSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskSet = await TaskSet.findById(req.params.id)
      .populate({
        path: 'taskTemplates',
        populate: [
          { path: 'dependencies' },
          { path: 'displayConditions.questionId' },
          { path: 'budgetAdjustments.questionId' }
        ]
      });

    if (!taskSet) {
      res.status(404).json({
        success: false,
        error: 'Task set not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: taskSet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new task set
export const createTaskSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskSet = await TaskSet.create(req.body);

    res.status(201).json({
      success: true,
      data: taskSet,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      res.status(400).json({
        success: false,
        error: messages,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Update task set
export const updateTaskSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskSet = await TaskSet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!taskSet) {
      res.status(404).json({
        success: false,
        error: 'Task set not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: taskSet,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      res.status(400).json({
        success: false,
        error: messages,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Delete task set
export const deleteTaskSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskSet = await TaskSet.findById(req.params.id);

    if (!taskSet) {
      res.status(404).json({
        success: false,
        error: 'Task set not found',
      });
      return;
    }

    await taskSet.deleteOne();

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

// Add task template to task set
export const addTaskTemplateToTaskSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskSetId, taskTemplateId } = req.params;
    
    // Check if task set exists
    const taskSet = await TaskSet.findById(taskSetId);
    if (!taskSet) {
      res.status(404).json({
        success: false,
        error: 'Task set not found',
      });
      return;
    }
    
    // Add task template to task set if not already added
    if (!taskSet.taskTemplates.includes(new mongoose.Types.ObjectId(taskTemplateId))) {
      taskSet.taskTemplates.push(new mongoose.Types.ObjectId(taskTemplateId));
      await taskSet.save();
    }
    
    res.status(200).json({
      success: true,
      data: taskSet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Remove task template from task set
export const removeTaskTemplateFromTaskSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskSetId, taskTemplateId } = req.params;
    
    // Check if task set exists
    const taskSet = await TaskSet.findById(taskSetId);
    if (!taskSet) {
      res.status(404).json({
        success: false,
        error: 'Task set not found',
      });
      return;
    }
    
    // Remove task template from task set
    taskSet.taskTemplates = taskSet.taskTemplates.filter(
      id => id.toString() !== taskTemplateId
    );
    await taskSet.save();
    
    res.status(200).json({
      success: true,
      data: taskSet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Update task template order in task set
export const updateTaskTemplateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskSetId } = req.params;
    const { taskTemplates } = req.body; // Array of task template IDs in the new order
    
    // Check if task set exists
    const taskSet = await TaskSet.findById(taskSetId);
    if (!taskSet) {
      res.status(404).json({
        success: false,
        error: 'Task set not found',
      });
      return;
    }
    
    // Validate that all task templates in the new order exist in the task set
    const currentTaskTemplateIds = taskSet.taskTemplates.map(id => id.toString());
    const validOrder = taskTemplates.every((id: string) => currentTaskTemplateIds.includes(id));
    
    if (!validOrder || taskTemplates.length !== taskSet.taskTemplates.length) {
      res.status(400).json({
        success: false,
        error: 'Invalid task template order',
      });
      return;
    }
    
    // Update task template order
    taskSet.taskTemplates = taskTemplates.map((id: string) => new mongoose.Types.ObjectId(id));
    await taskSet.save();
    
    res.status(200).json({
      success: true,
      data: taskSet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
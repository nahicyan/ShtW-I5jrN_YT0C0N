import { Request, Response } from 'express';
import TaskTemplate, { ITaskTemplate } from '../models/TaskTemplate';
import mongoose from 'mongoose';

// Get all task templates
export const getTaskTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskTemplates = await TaskTemplate.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: taskTemplates.length,
      data: taskTemplates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single task template
export const getTaskTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskTemplate = await TaskTemplate.findById(req.params.id)
      .populate('dependencies')
      .populate('displayConditions.questionId')
      .populate('budgetAdjustments.questionId');

    if (!taskTemplate) {
      res.status(404).json({
        success: false,
        error: 'Task template not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: taskTemplate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new task template
export const createTaskTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskTemplate = await TaskTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: taskTemplate,
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

// Update task template
export const updateTaskTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskTemplate = await TaskTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!taskTemplate) {
      res.status(404).json({
        success: false,
        error: 'Task template not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: taskTemplate,
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

// Delete task template
export const deleteTaskTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskTemplate = await TaskTemplate.findById(req.params.id);

    if (!taskTemplate) {
      res.status(404).json({
        success: false,
        error: 'Task template not found',
      });
      return;
    }

    await taskTemplate.deleteOne();

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
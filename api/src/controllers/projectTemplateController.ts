// api/src/controllers/projectTemplateController.ts
import { Request, Response } from 'express';
import ProjectTemplate from '../models/ProjectTemplate';
import Questionnaire from '../models/Questionnaire';
import TaskSet from '../models/TaskSet';

// Get all project templates
export const getProjectTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectTemplates = await ProjectTemplate.find()
      .populate('questionnaireId', 'name')
      .populate('taskSetId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projectTemplates.length,
      data: projectTemplates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single project template
export const getProjectTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectTemplate = await ProjectTemplate.findById(req.params.id)
      .populate('questionnaireId')
      .populate({
        path: 'taskSetId',
        populate: {
          path: 'taskTemplates',
          populate: [
            { path: 'dependencies' },
            { path: 'displayConditions.questionId' },
            { path: 'budgetAdjustments.questionId' }
          ]
        }
      });

    if (!projectTemplate) {
      res.status(404).json({
        success: false,
        error: 'Project template not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: projectTemplate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new project template
export const createProjectTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionnaireId, taskSetId } = req.body;
    
    // Validate questionnaire exists
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      res.status(400).json({
        success: false,
        error: 'Questionnaire not found',
      });
      return;
    }
    
    // Validate task set exists
    const taskSet = await TaskSet.findById(taskSetId);
    if (!taskSet) {
      res.status(400).json({
        success: false,
        error: 'Task set not found',
      });
      return;
    }
    
    const projectTemplate = await ProjectTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: projectTemplate,
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

// Update project template
export const updateProjectTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionnaireId, taskSetId } = req.body;
    
    if (questionnaireId) {
      // Validate questionnaire exists
      const questionnaire = await Questionnaire.findById(questionnaireId);
      if (!questionnaire) {
        res.status(400).json({
          success: false,
          error: 'Questionnaire not found',
        });
        return;
      }
    }
    
    if (taskSetId) {
      // Validate task set exists
      const taskSet = await TaskSet.findById(taskSetId);
      if (!taskSet) {
        res.status(400).json({
          success: false,
          error: 'Task set not found',
        });
        return;
      }
    }
    
    const projectTemplate = await ProjectTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!projectTemplate) {
      res.status(404).json({
        success: false,
        error: 'Project template not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: projectTemplate,
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

// Delete project template
export const deleteProjectTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectTemplate = await ProjectTemplate.findById(req.params.id);

    if (!projectTemplate) {
      res.status(404).json({
        success: false,
        error: 'Project template not found',
      });
      return;
    }

    await projectTemplate.deleteOne();

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
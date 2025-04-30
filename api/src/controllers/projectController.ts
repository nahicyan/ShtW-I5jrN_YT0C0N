import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Project, { IProject, ProjectStatus } from '../models/Project';
import ProjectTemplate from '../models/ProjectTemplate';
import Task from '../models/Task';

// Get all projects
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single project
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new project
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project,
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

// Update project
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
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

// Delete project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
      });
      return;
    }

    await project.deleteOne();

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

// Get projects by status
export const getProjectsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.params;
    
    // Validate status
    if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
      return;
    }
    
    const projects = await Project.find({ status }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};


//Create project from template
export const createProjectFromTemplate = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { templateId, questionAnswers, ...projectData } = req.body;
    
    // Validate and fetch project template
    const projectTemplate = await ProjectTemplate.findById(templateId)
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
      })
      .populate('questionnaireId');
    
    if (!projectTemplate) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({
        success: false,
        error: 'Project template not found',
      });
      return;
    }
    
    // Create the base project
    const project = await Project.create([{
      ...projectData
    }], { session });
    
    const projectId = project[0]._id;
    
    // Process task templates and create tasks
    const taskSet = projectTemplate.taskSetId as any; // Use type assertion to avoid TS errors
    
    if (taskSet && typeof taskSet === 'object' && taskSet.taskTemplates) {
      if (Array.isArray(taskSet.taskTemplates)) {
        const sortedTemplates = [...taskSet.taskTemplates];
        
        for (const template of sortedTemplates) {
          if (typeof template !== 'object') continue;
          
          // Check display conditions against question answers
          let shouldCreateTask = true;
          
          if (template.displayConditions.length > 0) {
            for (const condition of template.displayConditions) {
              const questionId = typeof condition.questionId === 'string' ? 
                condition.questionId : condition.questionId._id.toString();
              
              const answer = questionAnswers[questionId];
              const value = condition.value;
              
              if (answer === undefined) continue;
              
              // Evaluate condition
              let conditionMet = false;
              switch (condition.operator) {
                case 'equals':
                  conditionMet = answer === value;
                  break;
                case 'not_equals':
                  conditionMet = answer !== value;
                  break;
                case 'greater_than':
                  conditionMet = Number(answer) > Number(value);
                  break;
                case 'less_than':
                  conditionMet = Number(answer) < Number(value);
                  break;
                case 'contains':
                  conditionMet = String(answer).includes(String(value));
                  break;
                case 'not_contains':
                  conditionMet = !String(answer).includes(String(value));
                  break;
              }
              
              if ((condition.action === 'hide' && conditionMet) || 
                  (condition.action === 'show' && !conditionMet)) {
                shouldCreateTask = false;
                break;
              }
            }
          }
          
          if (!shouldCreateTask) continue;
          
          // Calculate task start and end dates
          const projectStartDate = new Date(projectData.startDate);
          let taskStartDate: Date;
          
          if (template.durationType === 'from_project_start') {
            taskStartDate = new Date(projectStartDate);
          } else {
            // For simplicity, just use project start date for now
            taskStartDate = new Date(projectStartDate);
          }
          
          const taskEndDate = new Date(taskStartDate);
          taskEndDate.setDate(taskEndDate.getDate() + template.duration);
          
          // Calculate budget with adjustments
          let taskBudget = template.estimatedBudget;
          
          for (const adjustment of template.budgetAdjustments) {
            const questionId = typeof adjustment.questionId === 'string' ? 
              adjustment.questionId : adjustment.questionId._id.toString();
            
            const answer = questionAnswers[questionId];
            const value = adjustment.value;
            
            if (answer === undefined) continue;
            
            // Evaluate condition
            let conditionMet = false;
            switch (adjustment.operator) {
              case 'equals':
                conditionMet = answer === value;
                break;
              case 'not_equals':
                conditionMet = answer !== value;
                break;
              case 'greater_than':
                conditionMet = Number(answer) > Number(value);
                break;
              case 'less_than':
                conditionMet = Number(answer) < Number(value);
                break;
              case 'contains':
                conditionMet = String(answer).includes(String(value));
                break;
              case 'not_contains':
                conditionMet = !String(answer).includes(String(value));
                break;
            }
            
            if (conditionMet) {
              // Apply budget adjustment
              switch (adjustment.adjustmentType) {
                case 'fixed':
                  taskBudget += Number(adjustment.amount);
                  break;
                case 'per_unit':
                  taskBudget += Number(adjustment.amount) * Number(answer);
                  break;
                case 'formula':
                  // Simple formula implementation
                  const formula = String(adjustment.amount).replace('[answer]', String(answer));
                  try {
                    taskBudget += eval(formula);
                  } catch (error) {
                    console.error('Error evaluating formula:', formula, error);
                  }
                  break;
              }
            }
          }
          
          // Create the task
          await Task.create([{
            name: template.name,
            description: template.description,
            projectId,
            startDate: taskStartDate,
            endDate: taskEndDate,
            estimatedBudget: taskBudget,
            status: 'not_started',
            dependencies: [],
          }], { session });
        }
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Fetch the complete project with tasks
    const createdProject = await Project.findById(projectId);
    
    res.status(201).json({
      success: true,
      data: createdProject,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
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
    
    console.error('Error creating project from template:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
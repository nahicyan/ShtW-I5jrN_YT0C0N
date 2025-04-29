import { Request, Response } from 'express';
import Budget, { IBudget, BudgetEntryType } from '../models/Budget';
import mongoose from 'mongoose';

// Get budget entries with optional filtering
export const getBudgetEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, weekStart, type } = req.query;
    
    const filter: any = {};
    
    // Apply filters if provided
    if (projectId) {
      filter.projectId = projectId;
    }
    
    if (weekStart) {
      const startDate = new Date(weekStart as string);
      // Create a date range for the entire week
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      filter.weekStart = { $gte: startDate };
      filter.weekEnd = { $lte: endDate };
    }
    
    if (type) {
      filter.type = type;
    }
    
    const budgets = await Budget.find(filter)
      .populate('projectId', 'name')
      .populate('taskId', 'name')
      .sort({ weekStart: -1 });
    
    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single budget entry
export const getBudgetEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('taskId', 'name');

    if (!budget) {
      res.status(404).json({
        success: false,
        error: 'Budget entry not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new budget entry
export const createBudgetEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.create(req.body);

    res.status(201).json({
      success: true,
      data: budget,
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

// Update budget entry
export const updateBudgetEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!budget) {
      res.status(404).json({
        success: false,
        error: 'Budget entry not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: budget,
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

// Delete budget entry
export const deleteBudgetEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404).json({
        success: false,
        error: 'Budget entry not found',
      });
      return;
    }

    await budget.deleteOne();

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

// Get budget summary by week
export const getBudgetSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { weekStart } = req.query;
    
    if (!weekStart) {
      res.status(400).json({
        success: false,
        error: 'Week start date is required',
      });
      return;
    }
    
    const startDate = new Date(weekStart as string);
    // Create a date range for the entire week
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Aggregate budget entries by project for the specified week
    const summary = await Budget.aggregate([
      {
        $match: {
          weekStart: { $gte: startDate },
          weekEnd: { $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            projectId: '$projectId',
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.projectId',
          entries: {
            $push: {
              type: '$_id.type',
              total: '$total',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project',
        },
      },
      {
        $unwind: '$project',
      },
      {
        $project: {
          _id: 1,
          projectName: '$project.name',
          forecast: {
            $reduce: {
              input: {
                $filter: {
                  input: '$entries',
                  as: 'entry',
                  cond: { $eq: ['$$entry.type', BudgetEntryType.FORECAST] },
                },
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.total'] },
            },
          },
          actual: {
            $reduce: {
              input: {
                $filter: {
                  input: '$entries',
                  as: 'entry',
                  cond: { $eq: ['$$entry.type', BudgetEntryType.ACTUAL] },
                },
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.total'] },
            },
          },
        },
      },
      {
        $sort: { projectName: 1 },
      },
    ]);
    
    // Calculate total across all projects
    const totalForecast = summary.reduce((sum, item) => sum + item.forecast, 0);
    const totalActual = summary.reduce((sum, item) => sum + item.actual, 0);
    
    res.status(200).json({
      success: true,
      weekStart: startDate,
      weekEnd: endDate,
      data: summary,
      totals: {
        forecast: totalForecast,
        actual: totalActual,
      },
    });
  } catch (error) {
    console.error('Budget summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get dashboard data for a week
export const getDashboardWeekly = async (req: Request, res: Response): Promise<void> => {
  try {
    const { weekStart } = req.query;
    
    if (!weekStart) {
      res.status(400).json({
        success: false,
        error: 'Week start date is required',
      });
      return;
    }
    
    const startDate = new Date(weekStart as string);
    // Create a date range for the entire week
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Get budget summary
    const budgetSummary = await Budget.aggregate([
      {
        $match: {
          weekStart: { $gte: startDate },
          weekEnd: { $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            projectId: '$projectId',
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.projectId',
          entries: {
            $push: {
              type: '$_id.type',
              total: '$total',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project',
        },
      },
      {
        $unwind: '$project',
      },
      {
        $project: {
          _id: 1,
          projectName: '$project.name',
          forecast: {
            $reduce: {
              input: {
                $filter: {
                  input: '$entries',
                  as: 'entry',
                  cond: { $eq: ['$$entry.type', BudgetEntryType.FORECAST] },
                },
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.total'] },
            },
          },
          actual: {
            $reduce: {
              input: {
                $filter: {
                  input: '$entries',
                  as: 'entry',
                  cond: { $eq: ['$$entry.type', BudgetEntryType.ACTUAL] },
                },
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.total'] },
            },
          },
        },
      },
      {
        $sort: { projectName: 1 },
      },
    ]);
    
    // Get task completion stats
    const taskStats = await Task.aggregate([
      {
        $match: {
          endDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate total across all projects
    const totalForecast = budgetSummary.reduce((sum, item) => sum + item.forecast, 0);
    const totalActual = budgetSummary.reduce((sum, item) => sum + item.actual, 0);
    
    res.status(200).json({
      success: true,
      weekStart: startDate,
      weekEnd: endDate,
      budgetData: budgetSummary,
      budgetTotals: {
        forecast: totalForecast,
        actual: totalActual,
      },
      taskStats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
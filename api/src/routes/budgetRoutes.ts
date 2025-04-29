import express from 'express';
import {
  getBudgetEntries,
  getBudgetEntry,
  createBudgetEntry,
  updateBudgetEntry,
  deleteBudgetEntry,
  getBudgetSummary,
  getDashboardWeekly
} from '../controllers/budgetController';

const router = express.Router();

// Budget routes
router.route('/summary').get(getBudgetSummary);
router.route('/').get(getBudgetEntries).post(createBudgetEntry);
router.route('/:id').get(getBudgetEntry).put(updateBudgetEntry).delete(deleteBudgetEntry);
router.route('/dashboard/weekly').get(getDashboardWeekly);


export default router;
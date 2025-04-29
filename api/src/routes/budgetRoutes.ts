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
router.get('/dashboard/weekly', getDashboardWeekly);
router.get('/summary', getBudgetSummary);
router.get('/', getBudgetEntries);
router.post('/', createBudgetEntry);
router.get('/:id', getBudgetEntry);
router.put('/:id', updateBudgetEntry);
router.delete('/:id', deleteBudgetEntry);


export default router;
import express from 'express';
import {
  getTaskSets,
  getTaskSet,
  createTaskSet,
  updateTaskSet,
  deleteTaskSet,
  addTaskTemplateToTaskSet,
  removeTaskTemplateFromTaskSet,
  updateTaskTemplateOrder,
} from '../controllers/taskSetController';

const router = express.Router();

// Task set routes
router.route('/').get(getTaskSets).post(createTaskSet);
router.route('/:id').get(getTaskSet).put(updateTaskSet).delete(deleteTaskSet);

// Task set task template management
router.route('/:taskSetId/taskTemplates/:taskTemplateId').post(addTaskTemplateToTaskSet).delete(removeTaskTemplateFromTaskSet);
router.route('/:taskSetId/taskTemplates/order').put(updateTaskTemplateOrder);

export default router;
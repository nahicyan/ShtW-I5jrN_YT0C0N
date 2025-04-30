import express from 'express';
import {
  getTaskTemplates,
  getTaskTemplate,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
} from '../controllers/taskTemplateController';

const router = express.Router();

// Task template routes
router.route('/').get(getTaskTemplates).post(createTaskTemplate);
router.route('/:id').get(getTaskTemplate).put(updateTaskTemplate).delete(deleteTaskTemplate);

export default router;
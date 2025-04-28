import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksByStatus,
} from '../controllers/taskController';

const router = express.Router();

// Task routes
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.route('/project/:projectId').get(getTasksByProject);
router.route('/status/:status').get(getTasksByStatus);

export default router;
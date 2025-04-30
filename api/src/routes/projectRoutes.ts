import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByStatus,
  createProjectFromTemplate,
} from '../controllers/projectController';

const router = express.Router();

// Project routes
router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.route('/status/:status').get(getProjectsByStatus);
router.route('/from-template').post(createProjectFromTemplate);

export default router;
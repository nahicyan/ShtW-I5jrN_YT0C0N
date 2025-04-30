// api/src/routes/projectTemplateRoutes.ts
import express from 'express';
import {
  getProjectTemplates,
  getProjectTemplate,
  createProjectTemplate,
  updateProjectTemplate,
  deleteProjectTemplate,
} from '../controllers/projectTemplateController';

const router = express.Router();

// Project template routes
router.route('/').get(getProjectTemplates).post(createProjectTemplate);
router.route('/:id').get(getProjectTemplate).put(updateProjectTemplate).delete(deleteProjectTemplate);

export default router;
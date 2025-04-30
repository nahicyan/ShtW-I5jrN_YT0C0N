import express from 'express';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController';

const router = express.Router();

// Question routes
router.route('/').get(getQuestions).post(createQuestion);
router.route('/:id').get(getQuestion).put(updateQuestion).delete(deleteQuestion);

export default router;
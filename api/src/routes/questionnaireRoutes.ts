import express from 'express';
import {
  getQuestionnaires,
  getQuestionnaire,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  addQuestionToQuestionnaire,
  removeQuestionFromQuestionnaire,
  updateQuestionOrder,
} from '../controllers/questionnaireController';

const router = express.Router();

// Questionnaire routes
router.route('/').get(getQuestionnaires).post(createQuestionnaire);
router.route('/:id').get(getQuestionnaire).put(updateQuestionnaire).delete(deleteQuestionnaire);

// Questionnaire question management
router.route('/:questionnaireId/questions/:questionId').post(addQuestionToQuestionnaire).delete(removeQuestionFromQuestionnaire);
router.route('/:questionnaireId/questions/order').put(updateQuestionOrder);

export default router;
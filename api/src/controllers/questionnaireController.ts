import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire';
import Question from '../models/Question';

// Get all questionnaires
export const getQuestionnaires = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionnaires = await Questionnaire.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: questionnaires.length,
      data: questionnaires,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Get single questionnaire with questions
export const getQuestionnaire = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id)
      .populate('questions');

    if (!questionnaire) {
      res.status(404).json({
        success: false,
        error: 'Questionnaire not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: questionnaire,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Create new questionnaire
export const createQuestionnaire = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionnaire = await Questionnaire.create(req.body);

    res.status(201).json({
      success: true,
      data: questionnaire,
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

// Update questionnaire
export const updateQuestionnaire = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionnaire = await Questionnaire.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!questionnaire) {
      res.status(404).json({
        success: false,
        error: 'Questionnaire not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: questionnaire,
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

// Delete questionnaire
export const deleteQuestionnaire = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const questionnaire = await Questionnaire.findById(req.params.id).session(session);

    if (!questionnaire) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({
        success: false,
        error: 'Questionnaire not found',
      });
      return;
    }

    // Delete associated questions if needed
    // Uncomment if you want to delete questions when deleting a questionnaire
    // await Question.deleteMany({ _id: { $in: questionnaire.questions } }).session(session);

    await questionnaire.deleteOne({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Add question to questionnaire
export const addQuestionToQuestionnaire = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionnaireId, questionId } = req.params;
    
    // Check if questionnaire exists
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      res.status(404).json({
        success: false,
        error: 'Questionnaire not found',
      });
      return;
    }
    
    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({
        success: false,
        error: 'Question not found',
      });
      return;
    }
    
    // Add question to questionnaire if not already added
    const questionObjectId = question._id as mongoose.Types.ObjectId;
    if (!questionnaire.questions.some(id => id.equals(questionObjectId))) {
      questionnaire.questions.push(questionObjectId);
      await questionnaire.save();
    }
    
    res.status(200).json({
      success: true,
      data: questionnaire,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Remove question from questionnaire
export const removeQuestionFromQuestionnaire = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionnaireId, questionId } = req.params;
    
    // Check if questionnaire exists
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      res.status(404).json({
        success: false,
        error: 'Questionnaire not found',
      });
      return;
    }
    
    // Remove question from questionnaire
    questionnaire.questions = questionnaire.questions.filter(
      id => id.toString() !== questionId
    );
    await questionnaire.save();
    
    res.status(200).json({
      success: true,
      data: questionnaire,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Update question order in questionnaire
export const updateQuestionOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionnaireId } = req.params;
    const { questions } = req.body; // Array of question IDs in the new order
    
    // Check if questionnaire exists
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      res.status(404).json({
        success: false,
        error: 'Questionnaire not found',
      });
      return;
    }
    
    // Validate that all questions in the new order exist in the questionnaire
    const currentQuestionIds = questionnaire.questions.map(id => id.toString());
    const validOrder = questions.every((id: string) => currentQuestionIds.includes(id));
    
    if (!validOrder || questions.length !== questionnaire.questions.length) {
      res.status(400).json({
        success: false,
        error: 'Invalid question order',
      });
      return;
    }
    
    // Update question order
    questionnaire.questions = questions.map((id: string) => new mongoose.Types.ObjectId(id));
    await questionnaire.save();
    
    res.status(200).json({
      success: true,
      data: questionnaire,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
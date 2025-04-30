import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionnaire extends Document {
  name: string;
  description?: string;
  questions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionnaireSchema = new Schema<IQuestionnaire>(
  {
    name: {
      type: String,
      required: [true, 'Questionnaire name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuestionnaire>('Questionnaire', QuestionnaireSchema);
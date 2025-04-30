import mongoose, { Document, Schema } from 'mongoose';

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  RANGE = 'range',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  DATE = 'date',
  BOOLEAN = 'boolean'
}

export interface IQuestion extends Document {
  text: string;
  answerType: QuestionType;
  isRequired: boolean;
  options?: string[]; // For select/multiselect
  minValue?: number; // For number/range
  maxValue?: number; // For number/range
  defaultValue?: string | number | boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    answerType: {
      type: String,
      enum: Object.values(QuestionType),
      required: [true, 'Answer type is required'],
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      validate: {
        validator: function(v: string[]) {
          return !(this.answerType === QuestionType.SELECT || 
                   this.answerType === QuestionType.MULTISELECT) || 
                 (v && v.length > 0);
        },
        message: 'Select/multiselect questions must have at least one option'
      }
    },
    minValue: {
      type: Number,
    },
    maxValue: {
      type: Number,
    },
    defaultValue: {
      type: Schema.Types.Mixed,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuestion>('Question', QuestionSchema);
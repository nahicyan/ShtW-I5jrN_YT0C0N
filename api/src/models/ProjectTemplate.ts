// api/src/models/ProjectTemplate.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectTemplate extends Document {
  name: string;
  description?: string;
  questionnaireId: mongoose.Types.ObjectId;
  taskSetId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTemplateSchema = new Schema<IProjectTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Project template name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    questionnaireId: {
      type: Schema.Types.ObjectId,
      ref: 'Questionnaire',
      required: [true, 'Questionnaire is required']
    },
    taskSetId: {
      type: Schema.Types.ObjectId,
      ref: 'TaskSet',
      required: [true, 'Task set is required']
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IProjectTemplate>('ProjectTemplate', ProjectTemplateSchema);
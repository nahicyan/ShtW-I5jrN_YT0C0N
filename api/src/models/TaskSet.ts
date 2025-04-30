import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskSet extends Document {
  name: string;
  description?: string;
  taskTemplates: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSetSchema = new Schema<ITaskSet>(
  {
    name: {
      type: String,
      required: [true, 'Task set name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    taskTemplates: [{
      type: Schema.Types.ObjectId,
      ref: 'TaskTemplate'
    }]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ITaskSet>('TaskSet', TaskSetSchema);
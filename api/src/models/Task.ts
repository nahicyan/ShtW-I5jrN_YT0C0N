import mongoose, { Document, Schema } from 'mongoose';

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export interface ITask extends Document {
  name: string;
  description?: string;
  projectId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedBudget: number;
  actualCost?: number;
  status: TaskStatus;
  dependencies: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    name: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
      maxlength: [100, 'Task name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    actualStartDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    estimatedBudget: {
      type: Number,
      required: [true, 'Estimated budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    actualCost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.NOT_STARTED,
    },
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for task duration
TaskSchema.virtual('duration').get(function (this: ITask) {
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Returns days
});

// Pre-save validation for dates
TaskSchema.pre('save', function (next) {
  if (this.startDate > this.endDate) {
    next(new Error('Start date cannot be after end date'));
  }
  next();
});

export default mongoose.model<ITask>('Task', TaskSchema);
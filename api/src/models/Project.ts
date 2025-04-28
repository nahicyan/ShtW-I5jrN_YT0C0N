import mongoose, { Document, Schema } from 'mongoose';

// Project status options
export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Project document interface
export interface IProject extends Document {
  name: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  location: string;
  squareFootage: number;
  estimatedBudget: number;
  actualBudget?: number;
  status: ProjectStatus;
  startDate: Date;
  estimatedEndDate: Date;
  actualEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Project schema
const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    clientPhone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Project location is required'],
      trim: true,
    },
    squareFootage: {
      type: Number,
      required: [true, 'Square footage is required'],
      min: [1, 'Square footage must be greater than 0'],
    },
    estimatedBudget: {
      type: Number,
      required: [true, 'Estimated budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    actualBudget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.PLANNING,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    estimatedEndDate: {
      type: Date,
      required: [true, 'Estimated end date is required'],
    },
    actualEndDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create virtual property for project duration
ProjectSchema.virtual('estimatedDuration').get(function (this: IProject) {
  const diffTime = Math.abs(
    this.estimatedEndDate.getTime() - this.startDate.getTime()
  );
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Returns days
});

// Pre-save middleware to validate dates
ProjectSchema.pre('save', function (next) {
  if (this.startDate > this.estimatedEndDate) {
    next(new Error('Start date cannot be after estimated end date'));
  }
  next();
});

export default mongoose.model<IProject>('Project', ProjectSchema);
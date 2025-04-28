import mongoose, { Document, Schema } from 'mongoose';

// Budget entry status
export enum BudgetEntryType {
  FORECAST = 'forecast',
  ACTUAL = 'actual',
}

// Budget document interface
export interface IBudget extends Document {
  projectId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  type: BudgetEntryType;
  weekStart: Date; // Beginning of the week (always a Monday)
  weekEnd: Date;   // End of the week (always a Sunday)
  createdAt: Date;
  updatedAt: Date;
}

// Budget schema
const BudgetSchema = new Schema<IBudget>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: Object.values(BudgetEntryType),
      required: [true, 'Budget entry type is required'],
    },
    weekStart: {
      type: Date,
      required: [true, 'Week start date is required'],
    },
    weekEnd: {
      type: Date,
      required: [true, 'Week end date is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to validate dates and set week boundaries
BudgetSchema.pre('save', function (next) {
  // Set week boundaries (Monday to Sunday)
  const startDate = new Date(this.weekStart);
  const day = startDate.getDay();
  
  // Adjust to previous Monday if not already Monday (day 1)
  if (day !== 1) {
    startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));
  }
  
  // Set time to beginning of day
  startDate.setHours(0, 0, 0, 0);
  this.weekStart = startDate;
  
  // Set week end to the Sunday after
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  this.weekEnd = endDate;
  
  next();
});

export default mongoose.model<IBudget>('Budget', BudgetSchema);
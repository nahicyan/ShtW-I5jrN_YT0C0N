import mongoose, { Document, Schema } from 'mongoose';

export enum DurationType {
  FROM_PROJECT_START = 'from_project_start',
  FROM_PREVIOUS_TASK = 'from_previous_task'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains'
}

export enum ConditionAction {
  SHOW = 'show',
  HIDE = 'hide'
}

export enum BudgetAdjustmentType {
  FIXED = 'fixed',
  PER_UNIT = 'per_unit',
  FORMULA = 'formula'
}

export interface IDisplayCondition {
  questionId: mongoose.Types.ObjectId;
  operator: ConditionOperator;
  value: any;
  action: ConditionAction;
}

export interface IBudgetAdjustment {
  questionId: mongoose.Types.ObjectId;
  operator: ConditionOperator;
  value: any;
  adjustmentType: BudgetAdjustmentType;
  amount: string | number; // String for formula, number for fixed/per unit
}

export interface ITaskTemplate extends Document {
  name: string;
  description?: string;
  duration: number;
  durationType: DurationType;
  displayConditions: IDisplayCondition[];
  budgetAdjustments: IBudgetAdjustment[];
  estimatedBudget: number;
  dependencies: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DisplayConditionSchema = new Schema<IDisplayCondition>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question ID is required']
  },
  operator: {
    type: String,
    enum: Object.values(ConditionOperator),
    required: [true, 'Operator is required']
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Condition value is required']
  },
  action: {
    type: String,
    enum: Object.values(ConditionAction),
    default: ConditionAction.SHOW
  }
}, { _id: false });

const BudgetAdjustmentSchema = new Schema<IBudgetAdjustment>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question ID is required']
  },
  operator: {
    type: String,
    enum: Object.values(ConditionOperator),
    required: [true, 'Operator is required']
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Condition value is required']
  },
  adjustmentType: {
    type: String,
    enum: Object.values(BudgetAdjustmentType),
    required: [true, 'Adjustment type is required']
  },
  amount: {
    type: Schema.Types.Mixed,
    required: [true, 'Amount is required']
  }
}, { _id: false });

const TaskTemplateSchema = new Schema<ITaskTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Task template name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0, 'Duration cannot be negative']
    },
    durationType: {
      type: String,
      enum: Object.values(DurationType),
      default: DurationType.FROM_PROJECT_START
    },
    displayConditions: [DisplayConditionSchema],
    budgetAdjustments: [BudgetAdjustmentSchema],
    estimatedBudget: {
      type: Number,
      default: 0,
      min: [0, 'Estimated budget cannot be negative']
    },
    dependencies: [{
      type: Schema.Types.ObjectId,
      ref: 'TaskTemplate'
    }]
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ITaskTemplate>('TaskTemplate', TaskTemplateSchema);
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Project status options
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PLANNING"] = "planning";
    ProjectStatus["IN_PROGRESS"] = "in_progress";
    ProjectStatus["ON_HOLD"] = "on_hold";
    ProjectStatus["COMPLETED"] = "completed";
    ProjectStatus["CANCELLED"] = "cancelled";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
// Project schema
const ProjectSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Create virtual property for project duration
ProjectSchema.virtual('estimatedDuration').get(function () {
    const diffTime = Math.abs(this.estimatedEndDate.getTime() - this.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Returns days
});
// Pre-save middleware to validate dates
ProjectSchema.pre('save', function (next) {
    if (this.startDate > this.estimatedEndDate) {
        next(new Error('Start date cannot be after estimated end date'));
    }
    next();
});
exports.default = mongoose_1.default.model('Project', ProjectSchema);

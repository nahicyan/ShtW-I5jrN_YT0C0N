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
exports.getProjectsByStatus = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.getProjects = void 0;
const Project_1 = __importStar(require("../models/Project"));
// Get all projects
const getProjects = async (req, res) => {
    try {
        const projects = await Project_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
};
exports.getProjects = getProjects;
// Get single project
const getProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }
        res.status(200).json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
};
exports.getProject = getProject;
// Create new project
const createProject = async (req, res) => {
    try {
        const project = await Project_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                success: false,
                error: messages,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
};
exports.createProject = createProject;
// Update project
const updateProject = async (req, res) => {
    try {
        const project = await Project_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }
        res.status(200).json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                success: false,
                error: messages,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
};
exports.updateProject = updateProject;
// Delete project
const deleteProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found',
            });
        }
        await project.deleteOne();
        res.status(200).json({
            success: true,
            data: {},
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
};
exports.deleteProject = deleteProject;
// Get projects by status
const getProjectsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        // Validate status
        if (!Object.values(Project_1.ProjectStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
            });
        }
        const projects = await Project_1.default.find({ status }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
};
exports.getProjectsByStatus = getProjectsByStatus;

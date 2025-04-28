"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const router = express_1.default.Router();
// Project routes
router.route('/').get(projectController_1.getProjects).post(projectController_1.createProject);
router.route('/:id').get(projectController_1.getProject).put(projectController_1.updateProject).delete(projectController_1.deleteProject);
router.route('/status/:status').get(projectController_1.getProjectsByStatus);
exports.default = router;

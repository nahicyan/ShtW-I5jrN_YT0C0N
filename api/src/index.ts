// api/src/index.ts
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import budgetRoutes from './routes/budgetRoutes';
import questionRoutes from './routes/questionRoutes';
import questionnaireRoutes from './routes/questionnaireRoutes';
import taskTemplateRoutes from './routes/taskTemplateRoutes';
import taskSetRoutes from './routes/taskSetRoutes';

// Load env vars
dotenv.config();

// Init express
const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/taskTemplates', taskTemplateRoutes);
app.use('/api/taskSets', taskSetRoutes);

// Home route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Shiny Homes Constructions API',
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/shiny-homes'
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
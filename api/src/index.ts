import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { auth } from 'express-openid-connect';
import projectRoutes from './routes/projectRoutes';

// Load env vars
dotenv.config();

// Init express
const app: Application = express();

// Body parser
app.use(express.json());

// Configure auth
const authConfig = {
  authRequired: false,
  auth0Logout: true,
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID || '',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || '',
  secret: process.env.AUTH0_SECRET || '',
};

// Use auth middleware if configured
if (process.env.AUTH0_CLIENT_ID && process.env.AUTH0_SECRET) {
  app.use(auth(authConfig));
}

// Routes
app.use('/api/projects', projectRoutes);

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
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
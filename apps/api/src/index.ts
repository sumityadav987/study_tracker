import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './env';
import { healthRouter } from './routes/health';
import { syncRouter } from './routes/sync';
import { authMiddleware } from './middleware/auth';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173'],
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/health', healthRouter);
app.use('/sync', authMiddleware, syncRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});
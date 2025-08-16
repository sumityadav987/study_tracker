import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  };
  
  res.json(health);
});

export { router as healthRouter };
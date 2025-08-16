import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { config } from '../env';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: config.FIREBASE_PROJECT_ID
  });
}

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
  };
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    (req as AuthenticatedRequest).user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};
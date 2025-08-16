import { Router } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { SessionAggregate } from '../models/SessionAggregate';

const router = Router();

// Validation schemas
const syncSessionSchema = z.object({
  session: z.object({
    id: z.string(),
    startedAt: z.string().transform(s => new Date(s)),
    endedAt: z.string().transform(s => new Date(s)),
    durationSec: z.number().min(0),
    engagedSec: z.number().min(0),
    distractedSec: z.number().min(0),
    awaySec: z.number().min(0),
    sleepySec: z.number().min(0),
    yawnCount: z.number().min(0),
    distractedEpisodes: z.number().min(0),
    notes: z.string().optional()
  }),
  timeSeries: z.array(z.object({
    tSec: z.number(),
    state: z.enum(['engaged', 'distracted', 'sleepy', 'away']),
    score: z.number().min(0).max(100)
  }))
});

// POST /sync/sessions - Upload session data
router.post('/sessions', async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const validatedData = syncSessionSchema.parse(req.body);
    
    // Ensure user exists
    await User.findOneAndUpdate(
      { uid: user.uid },
      { 
        uid: user.uid,
        email: user.email || '',
        lastSyncAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Downsample time series to reduce storage (max 1 point per 5 seconds)
    const downsampledTimeSeries = validatedData.timeSeries.filter((_, index) => index % 5 === 0);
    
    // Calculate average engagement score
    const avgEngagementScore = validatedData.timeSeries.length > 0
      ? validatedData.timeSeries.reduce((sum, point) => sum + point.score, 0) / validatedData.timeSeries.length
      : 0;

    // Create or update session aggregate
    const sessionAggregate = await SessionAggregate.findOneAndUpdate(
      { 
        userId: user.uid,
        sessionId: validatedData.session.id 
      },
      {
        userId: user.uid,
        sessionId: validatedData.session.id,
        startedAt: validatedData.session.startedAt,
        endedAt: validatedData.session.endedAt,
        durationSec: validatedData.session.durationSec,
        engagedSec: validatedData.session.engagedSec,
        distractedSec: validatedData.session.distractedSec,
        awaySec: validatedData.session.awaySec,
        sleepySec: validatedData.session.sleepySec,
        yawnCount: validatedData.session.yawnCount,
        distractedEpisodes: validatedData.session.distractedEpisodes,
        avgEngagementScore: Math.round(avgEngagementScore),
        notes: validatedData.session.notes,
        timeSeries: downsampledTimeSeries
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      sessionId: sessionAggregate.sessionId,
      message: 'Session synced successfully'
    });

  } catch (error) {
    console.error('Sync sessions error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    
    res.status(500).json({
      error: 'Failed to sync session'
    });
  }
});

// GET /sync/sessions - Get user's sessions
router.get('/sessions', async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { from, to, limit = '50' } = req.query;

    // Build query
    const query: any = { userId: user.uid };
    
    if (from || to) {
      query.startedAt = {};
      if (from) query.startedAt.$gte = new Date(from as string);
      if (to) query.startedAt.$lte = new Date(to as string);
    }

    const sessions = await SessionAggregate
      .find(query)
      .sort({ startedAt: -1 })
      .limit(parseInt(limit as string))
      .select('-timeSeries') // Exclude time series data in list view
      .lean();

    res.json({
      sessions,
      count: sessions.length
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve sessions'
    });
  }
});

// GET /sync/sessions/:sessionId - Get specific session with time series
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { sessionId } = req.params;

    const session = await SessionAggregate
      .findOne({ 
        userId: user.uid,
        sessionId 
      })
      .lean();

    if (!session) {
      res.status(404).json({
        error: 'Session not found'
      });
      return;
    }

    res.json(session);

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session'
    });
  }
});

export { router as syncRouter };
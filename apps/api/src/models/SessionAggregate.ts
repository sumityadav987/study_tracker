import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionAggregate extends Document {
  userId: string;
  sessionId: string;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  engagedSec: number;
  distractedSec: number;
  awaySec: number;
  sleepySec: number;
  yawnCount: number;
  distractedEpisodes: number;
  avgEngagementScore: number;
  notes?: string;
  
  // Downsampled time series (max 1 point per 5 seconds)
  timeSeries: Array<{
    tSec: number;
    state: 'engaged' | 'distracted' | 'sleepy' | 'away';
    score: number;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const sessionAggregateSchema = new Schema<ISessionAggregate>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  endedAt: {
    type: Date,
    required: true
  },
  durationSec: {
    type: Number,
    required: true,
    min: 0
  },
  engagedSec: {
    type: Number,
    required: true,
    min: 0
  },
  distractedSec: {
    type: Number,
    required: true,
    min: 0
  },
  awaySec: {
    type: Number,
    required: true,
    min: 0
  },
  sleepySec: {
    type: Number,
    required: true,
    min: 0
  },
  yawnCount: {
    type: Number,
    default: 0,
    min: 0
  },
  distractedEpisodes: {
    type: Number,
    default: 0,
    min: 0
  },
  avgEngagementScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  timeSeries: [{
    tSec: {
      type: Number,
      required: true
    },
    state: {
      type: String,
      enum: ['engaged', 'distracted', 'sleepy', 'away'],
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }]
}, {
  timestamps: true
});

// Compound index for efficient querying
sessionAggregateSchema.index({ userId: 1, startedAt: -1 });

export const SessionAggregate = mongoose.model<ISessionAggregate>('SessionAggregate', sessionAggregateSchema);
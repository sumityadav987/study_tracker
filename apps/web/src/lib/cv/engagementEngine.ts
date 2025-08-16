import { CVMetrics } from './faceApiLoader';
import { HandMetrics } from './mediapipeHands';

export type EngagementState = 'engaged' | 'distracted' | 'sleepy' | 'away';

export interface EngagementMetrics {
  state: EngagementState;
  score: number; // 0-100
  confidence: number; // 0-1
  timestamp: number;
}

export interface EngagementConfig {
  eyeClosedDuration: number; // seconds
  yawnDuration: number; // seconds
  lookAwayDuration: number; // seconds
  baselineScore: number;
  stateWeights: {
    engaged: number;
    distracted: number;
    sleepy: number;
    away: number;
  };
}

interface StateHistory {
  eyesClosedStart?: number;
  yawnStart?: number;
  lookAwayStart?: number;
  faceAbsentStart?: number;
}

export class EngagementEngine {
  private config: EngagementConfig;
  private stateHistory: StateHistory = {};
  private scoreHistory: number[] = [];
  private maxHistoryLength = 30; // Keep 30 seconds of history

  constructor(config?: Partial<EngagementConfig>) {
    this.config = {
      eyeClosedDuration: 1.0,
      yawnDuration: 1.0,
      lookAwayDuration: 1.0,
      baselineScore: 70,
      stateWeights: {
        engaged: 10,
        distracted: -15,
        sleepy: -25,
        away: -20,
      },
      ...config
    };
  }

  updateConfig(newConfig: Partial<EngagementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  processFrame(
    cvMetrics: CVMetrics,
    handMetrics: HandMetrics,
    timestamp: number
  ): EngagementMetrics {
    // Update state history based on current metrics
    this.updateStateHistory(cvMetrics, timestamp);

    // Determine current state
    const state = this.determineEngagementState(cvMetrics, handMetrics, timestamp);
    
    // Calculate engagement score
    const score = this.calculateEngagementScore(state, cvMetrics, handMetrics);
    
    // Calculate confidence based on detection quality
    const confidence = this.calculateConfidence(cvMetrics, handMetrics);

    // Store score in history for trends
    this.scoreHistory.push(score);
    if (this.scoreHistory.length > this.maxHistoryLength) {
      this.scoreHistory.shift();
    }

    return {
      state,
      score,
      confidence,
      timestamp
    };
  }

  private updateStateHistory(cvMetrics: CVMetrics, timestamp: number): void {
    // Track eye closure duration
    if (cvMetrics.eyesClosed) {
      if (!this.stateHistory.eyesClosedStart) {
        this.stateHistory.eyesClosedStart = timestamp;
      }
    } else {
      this.stateHistory.eyesClosedStart = undefined;
    }

    // Track yawn duration
    if (cvMetrics.yawning) {
      if (!this.stateHistory.yawnStart) {
        this.stateHistory.yawnStart = timestamp;
      }
    } else {
      this.stateHistory.yawnStart = undefined;
    }

    // Track look away duration
    if (cvMetrics.lookingAway) {
      if (!this.stateHistory.lookAwayStart) {
        this.stateHistory.lookAwayStart = timestamp;
      }
    } else {
      this.stateHistory.lookAwayStart = undefined;
    }

    // Track face absence
    if (!cvMetrics.facePresent) {
      if (!this.stateHistory.faceAbsentStart) {
        this.stateHistory.faceAbsentStart = timestamp;
      }
    } else {
      this.stateHistory.faceAbsentStart = undefined;
    }
  }

  private determineEngagementState(
    cvMetrics: CVMetrics,
    handMetrics: HandMetrics,
    timestamp: number
  ): EngagementState {
    // Check for away state (highest priority)
    if (!cvMetrics.facePresent) {
      const duration = this.stateHistory.faceAbsentStart 
        ? (timestamp - this.stateHistory.faceAbsentStart) / 1000 
        : 0;
      if (duration >= 2.0) { // Away for 2+ seconds
        return 'away';
      }
    }

    // Check for sleepy state
    const eyesClosedDuration = this.stateHistory.eyesClosedStart
      ? (timestamp - this.stateHistory.eyesClosedStart) / 1000
      : 0;
    const yawnDuration = this.stateHistory.yawnStart
      ? (timestamp - this.stateHistory.yawnStart) / 1000
      : 0;

    if (eyesClosedDuration >= this.config.eyeClosedDuration || 
        yawnDuration >= this.config.yawnDuration) {
      return 'sleepy';
    }

    // Check for distracted state
    const lookAwayDuration = this.stateHistory.lookAwayStart
      ? (timestamp - this.stateHistory.lookAwayStart) / 1000
      : 0;

    const isDistracted = 
      lookAwayDuration >= this.config.lookAwayDuration ||
      handMetrics.handsFidgeting ||
      handMetrics.handOverFace ||
      this.isNegativeExpression(cvMetrics.expressionLabel);

    if (isDistracted) {
      return 'distracted';
    }

    // Default to engaged if face present and stable
    if (cvMetrics.facePresent && 
        !cvMetrics.lookingAway && 
        !cvMetrics.eyesClosed) {
      return 'engaged';
    }

    return 'distracted';
  }

  private isNegativeExpression(expression: string): boolean {
    const negativeExpressions = ['sad', 'angry', 'fearful', 'disgusted', 'surprised'];
    return negativeExpressions.includes(expression);
  }

  private calculateEngagementScore(
    state: EngagementState,
    cvMetrics: CVMetrics,
    handMetrics: HandMetrics
  ): number {
    let score = this.config.baselineScore;

    // Apply state-based adjustment
    score += this.config.stateWeights[state];

    // Fine-tune based on specific metrics
    if (cvMetrics.facePresent) {
      score += 5; // Bonus for face presence
    }

    if (cvMetrics.expressionLabel === 'happy' || cvMetrics.expressionLabel === 'neutral') {
      score += 5; // Bonus for positive/neutral expression
    }

    if (handMetrics.handsFidgeting) {
      score -= 10; // Penalty for fidgeting
    }

    if (handMetrics.handOverFace) {
      score -= 15; // Penalty for hand over face
    }

    // Apply EAR and mouth ratio penalties
    if (cvMetrics.eyeAspectRatio < 0.15) { // Very tired eyes
      score -= 20;
    }

    if (cvMetrics.mouthOpenRatio > 0.8) { // Wide yawn
      score -= 15;
    }

    // Clamp score to 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateConfidence(
    cvMetrics: CVMetrics,
    handMetrics: HandMetrics
  ): number {
    let confidence = 0.5; // Base confidence

    if (cvMetrics.facePresent) {
      confidence += 0.3;
    }

    if (cvMetrics.eyeAspectRatio > 0) { // Valid eye tracking
      confidence += 0.1;
    }

    if (cvMetrics.expressionLabel !== 'unknown') {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  getAverageScore(windowSeconds = 10): number {
    const windowSize = Math.min(windowSeconds, this.scoreHistory.length);
    if (windowSize === 0) return this.config.baselineScore;

    const recentScores = this.scoreHistory.slice(-windowSize);
    return recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  }

  getTrendDirection(windowSeconds = 10): 'improving' | 'declining' | 'stable' {
    const windowSize = Math.min(windowSeconds, this.scoreHistory.length);
    if (windowSize < 5) return 'stable';

    const recentScores = this.scoreHistory.slice(-windowSize);
    const firstHalf = recentScores.slice(0, Math.floor(windowSize / 2));
    const secondHalf = recentScores.slice(Math.floor(windowSize / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  reset(): void {
    this.stateHistory = {};
    this.scoreHistory = [];
  }
}
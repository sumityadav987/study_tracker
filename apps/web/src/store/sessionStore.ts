import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { EngagementState, EngagementMetrics } from '../lib/cv/engagementEngine';
import { Session, TimeSeriesPoint, saveSession, saveTimeSeries } from '../lib/idb';
import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  isActive: boolean;
  isPaused: boolean;
  duration: number; // seconds
  timeSeries: EngagementMetrics[];
  lastNudgeTime?: number;
  nudgeCount: number;
}

interface SessionState {
  currentSession: SessionData | null;
  
  // Actions
  startSession: (userId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => Promise<string>; // Returns session ID
  addMetrics: (metrics: EngagementMetrics) => void;
  recordNudge: () => void;
  
  // Computed values
  getEngagementStats: () => {
    engaged: number;
    distracted: number;
    sleepy: number;
    away: number;
  };
  shouldShowNudge: (currentTime: number) => boolean;
}

const NUDGE_COOLDOWN_MS = 60000; // 1 minute between nudges

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      currentSession: null,

      startSession: (userId: string) => {
        const session: SessionData = {
          id: uuidv4(),
          userId,
          startedAt: new Date(),
          isActive: true,
          isPaused: false,
          duration: 0,
          timeSeries: [],
          nudgeCount: 0,
        };

        set({ currentSession: session }, false, 'startSession');
      },

      pauseSession: () => {
        const { currentSession } = get();
        if (!currentSession || !currentSession.isActive) return;

        set({
          currentSession: {
            ...currentSession,
            isPaused: true,
          }
        }, false, 'pauseSession');
      },

      resumeSession: () => {
        const { currentSession } = get();
        if (!currentSession || !currentSession.isActive) return;

        set({
          currentSession: {
            ...currentSession,
            isPaused: false,
          }
        }, false, 'resumeSession');
      },

      stopSession: async (): Promise<string> => {
        const { currentSession } = get();
        if (!currentSession) throw new Error('No active session');

        const endedAt = new Date();
        const duration = Math.floor((endedAt.getTime() - currentSession.startedAt.getTime()) / 1000);

        // Calculate session statistics
        const stats = get().getEngagementStats();
        
        // Count distracted episodes (consecutive distracted/sleepy states)
        let distractedEpisodes = 0;
        let inDistractedEpisode = false;
        
        currentSession.timeSeries.forEach((point) => {
          const isDistracted = point.state === 'distracted' || point.state === 'sleepy';
          if (isDistracted && !inDistractedEpisode) {
            distractedEpisodes++;
            inDistractedEpisode = true;
          } else if (!isDistracted) {
            inDistractedEpisode = false;
          }
        });

        // Count yawns (simplified - count sleepy episodes)
        const yawnCount = currentSession.timeSeries.filter(p => p.state === 'sleepy').length;

        // Create session record
        const sessionRecord: Session = {
          id: currentSession.id,
          userId: currentSession.userId,
          startedAt: currentSession.startedAt,
          endedAt,
          durationSec: duration,
          engagedSec: Math.round(stats.engaged * duration / 100),
          distractedSec: Math.round(stats.distracted * duration / 100),
          awaySec: Math.round(stats.away * duration / 100),
          sleepySec: Math.round(stats.sleepy * duration / 100),
          yawnCount,
          distractedEpisodes,
          version: 1,
        };

        // Create time series records
        const timeSeriesPoints: TimeSeriesPoint[] = currentSession.timeSeries.map((point, index) => ({
          id: `${currentSession.id}-${index}`,
          sessionId: currentSession.id,
          tSec: index,
          state: point.state,
          score: point.score,
        }));

        // Save to IndexedDB
        await saveSession(sessionRecord);
        await saveTimeSeries(timeSeriesPoints);

        // Clear current session
        set({
          currentSession: {
            ...currentSession,
            endedAt,
            isActive: false,
            duration,
          }
        }, false, 'stopSession');

        return currentSession.id;
      },

      addMetrics: (metrics: EngagementMetrics) => {
        const { currentSession } = get();
        if (!currentSession || !currentSession.isActive || currentSession.isPaused) return;

        const updatedTimeSeries = [...currentSession.timeSeries, metrics];
        const duration = updatedTimeSeries.length; // Assuming 1 sample per second

        set({
          currentSession: {
            ...currentSession,
            timeSeries: updatedTimeSeries,
            duration,
          }
        }, false, 'addMetrics');
      },

      recordNudge: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({
          currentSession: {
            ...currentSession,
            lastNudgeTime: Date.now(),
            nudgeCount: currentSession.nudgeCount + 1,
          }
        }, false, 'recordNudge');
      },

      getEngagementStats: () => {
        const { currentSession } = get();
        if (!currentSession || currentSession.timeSeries.length === 0) {
          return { engaged: 0, distracted: 0, sleepy: 0, away: 0 };
        }

        const total = currentSession.timeSeries.length;
        const counts = currentSession.timeSeries.reduce(
          (acc, point) => {
            acc[point.state]++;
            return acc;
          },
          { engaged: 0, distracted: 0, sleepy: 0, away: 0 }
        );

        return {
          engaged: Math.round((counts.engaged / total) * 100),
          distracted: Math.round((counts.distracted / total) * 100),
          sleepy: Math.round((counts.sleepy / total) * 100),
          away: Math.round((counts.away / total) * 100),
        };
      },

      shouldShowNudge: (currentTime: number): boolean => {
        const { currentSession } = get();
        if (!currentSession || !currentSession.lastNudgeTime) return true;
        
        return (currentTime - currentSession.lastNudgeTime) >= NUDGE_COOLDOWN_MS;
      },
    }),
    {
      name: 'session-store',
    }
  )
);
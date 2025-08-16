import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Session {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  engagedSec: number;
  distractedSec: number;
  awaySec: number;
  sleepySec: number;
  yawnCount: number;
  distractedEpisodes: number;
  notes?: string;
  version: number;
}

export interface TimeSeriesPoint {
  id: string;
  sessionId: string;
  tSec: number;
  state: 'engaged' | 'distracted' | 'sleepy' | 'away';
  score: number;
}

export interface UserSettings {
  id: string; // userId
  cloudSync: boolean;
  handsEnabled: boolean;
  notificationsEnabled: boolean;
  thresholds: {
    eyeClosedThreshold: number;
    yawnThreshold: number;
    lookAwayThreshold: number;
    fidgetingThreshold: number;
  };
}

interface StudyTrackerDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { 'by-user': string; 'by-date': Date };
  };
  timeseries: {
    key: string;
    value: TimeSeriesPoint;
    indexes: { 'by-session': string };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

let db: IDBPDatabase<StudyTrackerDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<StudyTrackerDB>> => {
  if (db) return db;

  db = await openDB<StudyTrackerDB>('studytracker_v1', 1, {
    upgrade(database) {
      // Sessions store
      const sessionStore = database.createObjectStore('sessions', {
        keyPath: 'id'
      });
      sessionStore.createIndex('by-user', 'userId');
      sessionStore.createIndex('by-date', 'startedAt');

      // Time series store
      const timeSeriesStore = database.createObjectStore('timeseries', {
        keyPath: 'id'
      });
      timeSeriesStore.createIndex('by-session', 'sessionId');

      // Settings store
      database.createObjectStore('settings', {
        keyPath: 'id'
      });
    }
  });

  return db;
};

export const saveSession = async (session: Session): Promise<void> => {
  const database = await initDB();
  await database.put('sessions', session);
};

export const saveTimeSeries = async (points: TimeSeriesPoint[]): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction('timeseries', 'readwrite');
  
  for (const point of points) {
    await tx.store.put(point);
  }
  
  await tx.done;
};

export const getSessionById = async (id: string): Promise<Session | undefined> => {
  const database = await initDB();
  return database.get('sessions', id);
};

export const getSessionsByUser = async (userId: string, limit = 50): Promise<Session[]> => {
  const database = await initDB();
  return database.getAllFromIndex('sessions', 'by-user', userId).then(
    sessions => sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, limit)
  );
};

export const getTimeSeriesBySession = async (sessionId: string): Promise<TimeSeriesPoint[]> => {
  const database = await initDB();
  return database.getAllFromIndex('timeseries', 'by-session', sessionId).then(
    points => points.sort((a, b) => a.tSec - b.tSec)
  );
};

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const database = await initDB();
  const settings = await database.get('settings', userId);
  
  if (settings) return settings;
  
  // Default settings
  const defaultSettings: UserSettings = {
    id: userId,
    cloudSync: false,
    handsEnabled: true,
    notificationsEnabled: false,
    thresholds: {
      eyeClosedThreshold: 0.2,
      yawnThreshold: 0.6,
      lookAwayThreshold: 1.0,
      fidgetingThreshold: 0.3
    }
  };
  
  await database.put('settings', defaultSettings);
  return defaultSettings;
};

export const updateUserSettings = async (settings: UserSettings): Promise<void> => {
  const database = await initDB();
  await database.put('settings', settings);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const database = await initDB();
  const tx = database.transaction(['sessions', 'timeseries'], 'readwrite');
  
  await tx.objectStore('sessions').delete(sessionId);
  
  // Delete associated time series points
  const timeSeriesPoints = await tx.objectStore('timeseries').index('by-session').getAllKeys(sessionId);
  for (const key of timeSeriesPoints) {
    await tx.objectStore('timeseries').delete(key);
  }
  
  await tx.done;
};

export const exportSessionData = async (sessionId: string): Promise<{ session: Session; timeSeries: TimeSeriesPoint[] }> => {
  const session = await getSessionById(sessionId);
  const timeSeries = await getTimeSeriesBySession(sessionId);
  
  if (!session) throw new Error('Session not found');
  
  return { session, timeSeries };
};
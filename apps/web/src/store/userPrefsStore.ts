import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UserSettings, getUserSettings, updateUserSettings } from '../lib/idb';

interface UserPrefsState {
  settings: UserSettings | null;
  isLoading: boolean;
  
  // Actions
  loadSettings: (userId: string) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  toggleCloudSync: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
  toggleHandsEnabled: () => Promise<void>;
  updateThresholds: (thresholds: Partial<UserSettings['thresholds']>) => Promise<void>;
}

export const useUserPrefsStore = create<UserPrefsState>()(
  devtools(
    persist(
      (set, get) => ({
        settings: null,
        isLoading: false,

        loadSettings: async (userId: string) => {
          set({ isLoading: true });
          try {
            const settings = await getUserSettings(userId);
            set({ settings, isLoading: false });
          } catch (error) {
            console.error('Failed to load user settings:', error);
            set({ isLoading: false });
          }
        },

        updateSettings: async (updates: Partial<UserSettings>) => {
          const { settings } = get();
          if (!settings) return;

          const updatedSettings = { ...settings, ...updates };
          
          try {
            await updateUserSettings(updatedSettings);
            set({ settings: updatedSettings });
          } catch (error) {
            console.error('Failed to update settings:', error);
          }
        },

        toggleCloudSync: async () => {
          const { settings, updateSettings } = get();
          if (!settings) return;
          
          await updateSettings({ cloudSync: !settings.cloudSync });
        },

        toggleNotifications: async () => {
          const { settings, updateSettings } = get();
          if (!settings) return;
          
          await updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
        },

        toggleHandsEnabled: async () => {
          const { settings, updateSettings } = get();
          if (!settings) return;
          
          await updateSettings({ handsEnabled: !settings.handsEnabled });
        },

        updateThresholds: async (thresholds: Partial<UserSettings['thresholds']>) => {
          const { settings, updateSettings } = get();
          if (!settings) return;
          
          const updatedThresholds = { ...settings.thresholds, ...thresholds };
          await updateSettings({ thresholds: updatedThresholds });
        },
      }),
      {
        name: 'user-prefs',
        partialize: (state) => ({ settings: state.settings }),
      }
    ),
    {
      name: 'user-prefs-store',
    }
  )
);
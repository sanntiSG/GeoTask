import { create } from 'zustand';
import { AppPermissions } from '../types/index.js';
import { storage, STORAGE_KEYS } from '../services/storage.service.js';

interface AppState {
  permissions: AppPermissions;
  onboardingComplete: boolean;
  activeTaskId: string | null;
  setPermissions: (permissions: Partial<AppPermissions>) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setActiveTaskId: (id: string | null) => void;
}

const defaultPermissions: AppPermissions = {
  notifications: 'prompt',
  geolocation: 'prompt',
  installed: false,
};

export const useAppStore = create<AppState>((set) => ({
  permissions: storage.get<AppPermissions>(STORAGE_KEYS.PERMISSIONS) ?? defaultPermissions,
  onboardingComplete: storage.get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE) ?? false,
  activeTaskId: null,

  setPermissions: (partial) =>
    set((state) => {
      const updated = { ...state.permissions, ...partial };
      storage.set(STORAGE_KEYS.PERMISSIONS, updated);
      return { permissions: updated };
    }),

  setOnboardingComplete: (complete) => {
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, complete);
    set({ onboardingComplete: complete });
  },

  setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
}));

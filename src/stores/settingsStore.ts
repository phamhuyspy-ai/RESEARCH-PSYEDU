
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  organizationName: string;
  logoUrl: string;
  primaryColor: string;
  language: 'vi' | 'en';
  gasUrl: string;
  aiProvider: 'gemini' | 'openai';
  isBotEnabled: boolean;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  updateSettings: (settings: Partial<Omit<SettingsState, 'hasHydrated' | 'setHasHydrated'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      organizationName: 'PsyEdu Research',
      logoUrl: 'https://storage.googleapis.com/a1aa/image/0N614o59N0tqO1485L7x8D2i82vH8h07R2m2s2b1n9m2b1n9.jpg',
      primaryColor: '#3b82f6',
      language: 'vi',
      gasUrl: 'https://script.google.com/macros/s/AKfycbxVkCxvaRQAArL4Jjv1ZO-A45i9a5gvN2jEaG9oujbsUenCi_coNISm7s35fF5E7zD2/exec',
      aiProvider: 'gemini',
      isBotEnabled: false,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true);
      },
    }
  )
);

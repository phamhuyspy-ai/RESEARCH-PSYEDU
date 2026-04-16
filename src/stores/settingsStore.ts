
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
      logoUrl: '',
      primaryColor: '#3b82f6',
      language: 'vi',
      gasUrl: '',
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


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Survey } from '../types';

interface AppState {
  surveys: Survey[];
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setSurveys: (surveys: Survey[]) => void;
  addSurvey: (survey: Survey) => void;
  updateSurvey: (survey: Survey) => void;
  deleteSurvey: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      surveys: [],
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setSurveys: (surveys) => set({ surveys }),
      addSurvey: (survey) => set((state) => ({ surveys: [...state.surveys, survey] })),
      updateSurvey: (survey) =>
        set((state) => ({
          surveys: state.surveys.map((s) => (s.id === survey.id ? survey : s)),
        })),
      deleteSurvey: (id) =>
        set((state) => ({
          surveys: state.surveys.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true);
      },
    }
  )
);

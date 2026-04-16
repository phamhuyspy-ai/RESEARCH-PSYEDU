
import { create } from 'zustand';
import { Survey, SurveyBlock, ScoreGroup, AlertRule } from '../types';

interface BuilderState {
  activeSurvey: Survey | null;
  setActiveSurvey: (survey: Survey | null) => void;
  updateSurveyMeta: (meta: Partial<Survey>) => void;
  updateSurveySettings: (settings: Partial<Survey['settings']>) => void;
  updateBranding: (branding: Partial<Survey['branding']>) => void;
  
  // Blocks
  addBlock: (block: SurveyBlock) => void;
  updateBlock: (block: SurveyBlock) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (blocks: SurveyBlock[]) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  
  // Score Groups
  addScoreGroup: (group: ScoreGroup) => void;
  updateScoreGroup: (group: ScoreGroup) => void;
  removeScoreGroup: (code: string) => void;
  
  // Alerts
  addAlert: (alert: AlertRule) => void;
  updateAlert: (alert: AlertRule) => void;
  removeAlert: (id: string) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  activeSurvey: null,
  setActiveSurvey: (survey) => set({ activeSurvey: survey }),
  
  updateSurveyMeta: (meta) =>
    set((state) => ({
      activeSurvey: state.activeSurvey ? { ...state.activeSurvey, ...meta } : null,
    })),
    
  updateSurveySettings: (settings) =>
    set((state) => ({
      activeSurvey: state.activeSurvey 
        ? { ...state.activeSurvey, settings: { ...state.activeSurvey.settings, ...settings } } 
        : null,
    })),

  updateBranding: (branding) =>
    set((state) => ({
      activeSurvey: state.activeSurvey 
        ? { ...state.activeSurvey, branding: { ...state.activeSurvey.branding, ...branding } } 
        : null,
    })),

  addBlock: (block) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? { ...state.activeSurvey, blocks: [...state.activeSurvey.blocks, block] }
        : null,
    })),
    
  updateBlock: (block) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? {
            ...state.activeSurvey,
            blocks: state.activeSurvey.blocks.map((b) => (b.id === block.id ? block : b)),
          }
        : null,
    })),
    
  removeBlock: (id) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? {
            ...state.activeSurvey,
            blocks: state.activeSurvey.blocks.filter((b) => b.id !== id),
          }
        : null,
    })),
    
  reorderBlocks: (blocks) =>
    set((state) => ({
      activeSurvey: state.activeSurvey ? { ...state.activeSurvey, blocks } : null,
    })),

  moveBlockUp: (id) =>
    set((state) => {
      if (!state.activeSurvey) return state;
      const index = state.activeSurvey.blocks.findIndex(b => b.id === id);
      if (index <= 0) return state;
      const newBlocks = [...state.activeSurvey.blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      return { activeSurvey: { ...state.activeSurvey, blocks: newBlocks } };
    }),

  moveBlockDown: (id) =>
    set((state) => {
      if (!state.activeSurvey) return state;
      const index = state.activeSurvey.blocks.findIndex(b => b.id === id);
      if (index === -1 || index === state.activeSurvey.blocks.length - 1) return state;
      const newBlocks = [...state.activeSurvey.blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      return { activeSurvey: { ...state.activeSurvey, blocks: newBlocks } };
    }),

  addScoreGroup: (group) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? { ...state.activeSurvey, scoreGroups: [...state.activeSurvey.scoreGroups, group] }
        : null,
    })),

  updateScoreGroup: (group) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? {
            ...state.activeSurvey,
            scoreGroups: state.activeSurvey.scoreGroups.map((g) => (g.code === group.code ? group : g)),
          }
        : null,
    })),

  removeScoreGroup: (code) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? {
            ...state.activeSurvey,
            scoreGroups: state.activeSurvey.scoreGroups.filter((g) => g.code !== code),
          }
        : null,
    })),

  addAlert: (alert) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? { 
            ...state.activeSurvey, 
            settings: { 
              ...state.activeSurvey.settings, 
              alerts: [...state.activeSurvey.settings.alerts, alert] 
            } 
          }
        : null,
    })),

  updateAlert: (alert) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? {
            ...state.activeSurvey,
            settings: {
              ...state.activeSurvey.settings,
              alerts: state.activeSurvey.settings.alerts.map((a) => (a.id === alert.id ? alert : a)),
            },
          }
        : null,
    })),

  removeAlert: (id) =>
    set((state) => ({
      activeSurvey: state.activeSurvey
        ? {
            ...state.activeSurvey,
            settings: {
              ...state.activeSurvey.settings,
              alerts: state.activeSurvey.settings.alerts.filter((a) => a.id !== id),
            },
          }
        : null,
    })),
}));

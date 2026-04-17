
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppSettings } from '../types';

interface SettingsState extends AppSettings {
  gasUrl: string;
  language: 'vi' | 'en';
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  updateSettings: (settings: Partial<Omit<SettingsState, 'hasHydrated' | 'setHasHydrated'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appName: 'PSYEDU RESEARCH',
      orgName: 'Viện Tâm lý Giáo dục PSYEDU',
      address: 'Số 1, Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
      contactEmail: 'contact@psyedu.vn',
      notifyEmail: 'psyedu.research@gmail.com',
      phone: '024 123 4567',
      logoUrl: 'https://storage.googleapis.com/a1aa/image/0N614o59N0tqO1485L7x8D2i82vH8h07R2m2s2b1n9m2b1n9.jpg',
      socialLinks: {
        website: 'https://psyedu.vn',
        facebook: '',
        youtube: '',
        tiktok: ''
      },
      theme: {
        primaryColor: '#2E97A7',
        secondaryColor: '#D49320',
        backgroundColor: '#F8FAFC',
        textColor: '#1f2937',
        linkColor: '#2E97A7',
        hoverColor: '#247a87',
        fontFamily: 'Inter, sans-serif'
      },
      aiConfig: {
        enabled: false,
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-1.5-flash', // Default to most token-efficient
        systemPrompt: 'Bạn là trợ lý ảo của Viện Tâm lý Giáo dục PSYEDU. Nhiệm vụ của bạn là giải đáp các thắc mắc về các bài kiểm tra tâm lý, hướng dẫn người dùng thực hiện bài kiểm tra, và cung cấp các thông tin cơ bản về tâm lý học. Hãy trả lời ngắn gọn, dễ hiểu và lịch sự.'
      },
      publicRuntime: {
        showResults: true,
        requirePersonalInfo: true,
        sendEmail: true,
        requireConsent: true
      },
      cta: {
        type: 'booking',
        label: 'Đặt lịch tư vấn ngay',
        url: 'https://sunnycare.vn/dat-lich',
        showInResults: true,
        showInPdf: true,
        showInEmail: true
      },
      users: [
        { id: '1', name: 'Manager 1', email: 'manager@psyedu.vn', role: 'manager' }
      ],
      language: 'vi',
      gasUrl: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbxVkCxvaRQAArL4Jjv1ZO-A45i9a5gvN2jEaG9oujbsUenCi_coNISm7s35fF5E7zD2/exec',
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

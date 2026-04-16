
export type Role = 'super_admin' | 'manager' | 'user';

export interface User {
  id?: string;
  email: string;
  role: Role;
  name: string;
  password?: string;
  workspaceType?: 'shared' | 'private';
}

export interface SocialLinks {
  website?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  hoverColor: string;
  fontFamily: string;
}

export interface CTASettings {
  type: string;
  label: string;
  url: string;
  showInResults: boolean;
  showInPdf: boolean;
  showInEmail: boolean;
}

export interface AppSettings {
  appName: string;
  orgName: string;
  address: string;
  contactEmail: string;
  notifyEmail: string;
  phone: string;
  logoUrl: string;
  socialLinks: SocialLinks;
  theme: ThemeConfig;
  aiConfig: {
    enabled: boolean;
    provider: 'gemini' | 'openai';
    apiKey: string;
    model: string;
    systemPrompt?: string;
  };
  publicRuntime: {
    showResults: boolean;
    requirePersonalInfo: boolean;
    sendEmail: boolean;
    requireConsent: boolean;
  };
  cta: CTASettings;
  users: User[];
}

export interface ScoreGroup {
  code: string;
  name: string;
  calculationType: 'sum' | 'average';
  description?: string;
}

export interface AlertRule {
  id: string;
  scoreGroupCode: string;
  min: number;
  max: number;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface SurveyBlock {
  id: string;
  code: string;
  type: 'content' | 'contact' | 'single_choice' | 'multi_choice' | 'likert' | 'text' | 'matrix';
  title: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  visible?: boolean;
  options?: { label: string; value: string; score?: number }[];
  matrixRows?: { label: string; code: string }[];
  matrixCols?: { label: string; value: string; score?: number; type?: 'single_choice' | 'multi_choice' | 'text' | 'number' }[];
  scoreEnabled?: boolean;
  scoreGroupCode?: string;
  reverseScore?: boolean;
  weight?: number;
  minScore?: number;
  maxScore?: number;
  // Contact specific
  contactFields?: {
    name: boolean;
    email: boolean;
    phone: boolean;
    org: boolean;
    customFields?: { id: string; label: string; required: boolean }[];
  };
}

export interface Survey {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
  status: 'draft' | 'published';
  collectionStatus: 'open' | 'closed';
  blocks: SurveyBlock[];
  scoreGroups: ScoreGroup[];
  settings: {
    showResults: boolean;
    showRadarChart: boolean;
    sendEmail: boolean;
    thankYouMessage: string;
    startDate?: string;
    endDate?: string;
    reward?: string;
    cta?: {
      text: string;
      url: string;
    };
    alerts: AlertRule[];
    encouragementMessages?: {
      step: number;
      message: string;
    }[];
  };
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  submission_id: string;
  timestamp: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  user_org?: string;
  responses: Record<string, any>;
  total_score: number;
  group_scores?: Record<string, number>;
  result_interpretation: string;
}


export type Role = 'super_admin' | 'manager' | 'user';

export interface User {
  email: string;
  role: Role;
  name: string;
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
  matrixCols?: { label: string; value: string; score?: number }[];
  scoreEnabled?: boolean;
  scoreGroupCode?: string;
  reverseScore?: boolean;
  weight?: number;
  minScore?: number;
  maxScore?: number;
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

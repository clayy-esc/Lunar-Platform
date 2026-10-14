export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multi_choice'
  | 'rating'
  | 'linear_scale'
  | 'dropdown'
  | 'date'
  | 'number';

export interface QuestionConfig {
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
  placeholder?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  options: string[];
  config: QuestionConfig;
  order: number;
}

export interface LogicRule {
  id: string;
  sourceQuestionId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  targetQuestionId: string;
}

export interface SurveyTheme {
  primaryColor: string;
  backgroundColor: string;
  layout?: 'single_page' | 'one_at_a_time';
  lightPrimaryColor?: string;
  lightBackgroundColor?: string;
  fontFamily: string;
  customCSS: string;
}

export interface SurveySettings {
  allowMultipleSubmissions: boolean;
  showProgressBar: boolean;
  shuffleQuestions: boolean;
  thankYouMessage: string;
}

export interface Survey {
  _id: string;
  userId: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  publicSlug?: string;
  questions: Question[];
  logic: LogicRule[];
  theme: SurveyTheme;
  settings: SurveySettings;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  questionId: string;
  value: any;
}

export interface ResponseMetadata {
  submittedAt: string;
  completionTime?: number;
  fingerprint?: string;
}

export interface SurveyResponse {
  _id: string;
  surveyId: string;
  userId: string;
  answers: Answer[];
  metadata: ResponseMetadata;
}

export interface AnalyticsData {
  surveyId: string;
  title: string;
  totalResponses: number;
  completionStats?: {
    avgTime: number;
    minTime: number;
    maxTime: number;
  };
  questions: {
    id: string;
    title: string;
    type: QuestionType;
    totalAnswers?: number;
    data?: any;
    samples?: string[];
    distribution?: { label: string; count: number }[];
  }[];
}

export interface StorageHealth {
  status: 'healthy' | 'warning' | 'critical';
  storage: {
    dataSizeMB: number;
    indexSizeMB: number;
    totalSizeMB: number;
    limitMB: number;
    usagePercent: number;
  };
  collections: number;
  documents: number;
}

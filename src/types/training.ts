// Training module types for the frontend application

export type ContentType = 'html' | 'markdown' | 'video';
export type QuestionType = 'single-choice' | 'multiple-choice' | 'true-false';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TrainingQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  explanation?: string;
  points: number;
}

export interface Certificate {
  enabled: boolean;
  title?: string;
  description?: string;
  issuer?: string;
  validMonths?: number;
}

export interface Badge {
  name?: string;
  description?: string;
  imageUrl?: string;
  criteria?: {
    minScore?: number;
    minCompletionTime?: number;
    maxAttempts?: number;
  };
}

export interface TrainingModule {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  content: string;
  contentType: ContentType;
  videoUrl?: string;
  questions: TrainingQuestion[];
  passingScore: number;
  estimatedDuration: number; // in minutes
  category: string;
  tags: string[];
  difficulty: DifficultyLevel;
  certificate?: Certificate;
  badge?: Badge;
  published: boolean;
  featured: boolean;
  requiredForRoles?: string[];
  prerequisiteModules?: string[];
  completionCount: number;
  averageScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingModuleCreateInput {
  title: string;
  description: string;
  content: string;
  contentType: ContentType;
  videoUrl?: string;
  questions: Omit<TrainingQuestion, 'id'>[];
  passingScore?: number;
  estimatedDuration: number;
  category: string;
  tags?: string[];
  difficulty?: DifficultyLevel;
  certificate?: Certificate;
  badge?: Badge;
  published?: boolean;
  featured?: boolean;
  requiredForRoles?: string[];
  prerequisiteModules?: string[];
}

export interface TrainingModuleUpdateInput {
  title?: string;
  description?: string;
  content?: string;
  contentType?: ContentType;
  videoUrl?: string;
  questions?: TrainingQuestion[];
  passingScore?: number;
  estimatedDuration?: number;
  category?: string;
  tags?: string[];
  difficulty?: DifficultyLevel;
  certificate?: Certificate;
  badge?: Badge;
  published?: boolean;
  featured?: boolean;
  requiredForRoles?: string[];
  prerequisiteModules?: string[];
}

export interface UserAnswer {
  questionId: string;
  selectedOptions: string[];
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

export interface UserProgress {
  id: string;
  userId: string;
  tenantId: string;
  moduleId: string;
  completed: boolean;
  score: number;
  attemptsCount: number;
  lastAttemptDate: string;
  completedDate?: string;
  timeSpent: number; // in seconds
  answers: UserAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingStats {
  modules: {
    id: string;
    title: string;
    completionCount: number;
    averageScore: number;
  }[];
  stats: {
    totalUsers: number;
    totalCompletedModules: number;
    averageCompletionRate: number;
    overallAverageScore: number;
  };
} 
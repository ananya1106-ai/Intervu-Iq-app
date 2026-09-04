export type PageType = 
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'dashboard'
  | 'mock-interview'
  | 'resume-analyzer'
  | 'facial-analysis'
  | 'speech-coach'
  | 'performance'
  | 'roadmap'
  | 'profile'
  | 'settings'
  | 'dsa-recommendations'
  | 'dsa-prep';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  targetRole: string;
  avatar: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior';
  resumeUploaded: boolean;
  resumeFileName?: string;
  placementReadiness: number; // 0-100
  confidenceMeter: number; // 0-100
  interviewsCompleted: number;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  category: 'Technical' | 'Behavioral' | 'System Design' | 'General';
  suggestedPoints: string[];
}

export interface InterviewSession {
  id: string;
  date: string;
  role: string;
  type: 'Behavioral' | 'Technical' | 'System Design';
  durationSeconds: number;
  overallScore: number;
  metrics: {
    communication: number;
    technical: number;
    confidence: number;
    bodyLanguage: number;
    speech: number;
  };
  questionsAnswered: {
    question: string;
    transcript: string;
    feedback: string;
    score: number;
  }[];
}

export interface ResumeAnalysisResult {
  fileName: string;
  fileSize: string;
  atsScore: number;
  skillsAnalysis: {
    matched: string[];
    missing: string[];
  };
  sectionsFound: {
    experience: boolean;
    education: boolean;
    projects: boolean;
    skills: boolean;
  };
  aiSuggestions: {
    category: 'Impact' | 'Formatting' | 'Keywords' | 'Structure';
    severity: 'High' | 'Medium' | 'Low';
    text: string;
  }[];
}

export interface RoadmapResource {
  title: string;
  url?: string;
  type: 'video' | 'article' | 'practice' | 'documentation';
}

export interface RoadmapMilestone {
  id: string;
  milestoneNumber?: number;
  category: string;
  title: string;
  description: string;
  whySelected?: string;
  estimatedMinutes: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  requiredSkills?: string[];
  resources: RoadmapResource[];
  practicalTask?: string;
  interviewQuestions?: string[];
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'locked' | 'unlocked' | 'completed';
}

export interface RoadmapData {
  id?: string;
  generatedAt?: any;
  targetRole: string;
  sourceInterviewIds?: string[];
  sourceATSScore?: number | null;
  milestones: RoadmapMilestone[];
  overallProgress: number;
  completedCount: number;
  totalMilestones: number;
  lastProcessedInterviewId?: string;
  updatedAfterInterview?: boolean;
  lastUpdated?: any;
}

export type RoadmapNode = RoadmapMilestone;

export interface SpeechMetrics {
  wpm: number;
  fillerWords: { um: number; uh: number; like: number; actually: number; basically: number };
  pronunciationScore: number;
  voiceConfidence: number; // 0-100
  pauseSeconds: number;
}

export interface FacialMetrics {
  emotion: 'Confident' | 'Focused' | 'Neutral' | 'Anxious' | 'Smiling';
  eyeContactPercent: number;
  smilePercent: number;
  blinkCount: number;
  postureStatus: 'Good' | 'Leaning Forward' | 'Leaning Back' | 'Slouched';
}

export interface ExpressionSummaryData {
  averageEyeContact: number;
  averageSmile: number;
  totalBlinks: number;
  dominantEmotion: 'Confident' | 'Focused' | 'Neutral' | 'Anxious' | 'Smiling';
  postureStatus: 'Good' | 'Leaning Forward' | 'Leaning Back' | 'Slouched';
  eyeContactAssessment: string;
  expressionFeedback: string;
  totalSamples?: number;
}

export interface FillerBreakdown {
  um: number;
  uh: number;
  like: number;
  actually: number;
  basically: number;
  youKnow: number;
}

export interface SpeechAnalysisData {
  speakingRate: number;
  fillerWordCount: number;
  fillerBreakdown?: FillerBreakdown;
  pauseCount: number;
  averagePauseDuration: number;
  speechDuration: number;
  responseDuration: number;
  speechActivityRatio?: number;
  fluencyScore: number;
  fluencyAssessment: string;
  vocalFeedback: string;
}

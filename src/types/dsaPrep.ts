export interface DSAQuestionItem {
  id?: string;
  title: string;
  company: string[];
  topic: string;
  pattern: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  platform: string;
  url: string;
  tags: string[];
  isSolved?: boolean;
}

export interface DSAResourceItem {
  id?: string;
  title: string;
  type: string;
  topic: string;
  platform: string;
  url: string;
  description: string;
}

export interface DSACompanyItem {
  id?: string;
  name: string;
  slug: string;
}

export interface DSASheetItem {
  id?: string;
  name: string;
  creator: string;
  category: string;
  problem_count: string;
  level: string;
  platform: string;
  url: string;
  description: string;
}

export interface DSATopicItem {
  id?: string;
  topic: string;
  description: string;
}

export interface DSAVideoResourceItem {
  id?: string;
  name: string;
  creator: string;
  category: string;
  level: string;
  language: string;
  type: string;
  url: string;
  description: string;
}

export interface DSAVideoTopicItem {
  id?: string;
  topic: string;
  description: string;
}

export interface DSAFilterState {
  search: string;
  company: string;
  topic: string;
  difficulty: string;
  pattern: string;
  platform: string;
  status: 'all' | 'solved' | 'unsolved';
}

export interface DSAStats {
  questionsSolved: number;
  totalQuestions: number;
  topicsCount: number;
  companiesCount: number;
  sheetsCount: number;
}

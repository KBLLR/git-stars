export interface LanguageInfo {
  language: string;
  percentage: string;
}

export interface Repo {
  name: string;
  description: string;
  author: string;
  stars: number;
  forks: number;
  open_issues: number;
  date: string; // starred_at date
  last_updated: string;
  last_updated_at?: string;
  created_at?: string;
  language?: string;
  primary_language?: string;
  license?: string;
  languages: LanguageInfo[];
  topics: string[];
  url: string;
  private?: boolean;
  has_readme?: boolean | null;
  is_owner?: boolean;
  is_fork?: boolean;
}

export interface LanguageGroup {
  language: string;
  repos: Repo[];
}

export type RepoSignalScope = 'starred' | 'mine' | 'research';
export type RepoStaleness = 'active' | 'watch' | 'stale';
export type ResearchStatus = 'queued' | 'researching' | 'done' | 'dismissed' | 'untracked';
export type AdoptionKind = 'house' | 'tool' | 'service' | 'template' | 'ignore';

export interface RepoSignal {
  nwo: string;
  name: string;
  author: string;
  description: string;
  scope: RepoSignalScope;
  lastActivityAt: string;
  staleness: RepoStaleness;
  researchStatus: ResearchStatus;
  adoptionScore: number;
  adoptionKind: AdoptionKind;
  reasons: string[];
  houseSkills: string[];
  capabilities: string[];
}

export interface ResearchQueueItem {
  nwo: string;
  status: Exclude<ResearchStatus, 'untracked'>;
  priority: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillExtraction {
  nwo: string;
  name: string;
  author: string;
  summary: string;
  capabilities: string[];
  houseSkills: string[];
  rules: string[];
  flows: string[];
  adoptionKind: AdoptionKind;
  codexBrief: string;
  claudeBrief: string;
}

export interface MineHealthRecord {
  nwo: string;
  name: string;
  author: string;
  visibility: 'public' | 'private';
  hasReadme: boolean | null;
  updatedAt: string;
  healthFlags: string[];
  recommendedActions: string[];
}

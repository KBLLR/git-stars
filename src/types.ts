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

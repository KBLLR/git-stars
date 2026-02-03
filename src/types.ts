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
  language?: string;
  languages: LanguageInfo[];
  topics: string[];
  url: string;
}

export interface LanguageGroup {
  language: string;
  repos: Repo[];
}

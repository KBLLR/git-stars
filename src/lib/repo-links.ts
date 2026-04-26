import { Repo } from '../types';

const ABOUT_OVERRIDES: Record<string, string> = {
  'KBLLR/vega-lab': 'https://gitstars-gb6ccye00-kbllr-projects.vercel.app/',
  'KBLLR/git-stars': 'https://gitstars-gb6ccye00-kbllr-projects.vercel.app/',
};

export function getRepoAboutUrl(repo: Repo): string {
  const key = `${repo.author}/${repo.name}`;
  return ABOUT_OVERRIDES[key] || repo.url;
}

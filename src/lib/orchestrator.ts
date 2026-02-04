import type { Repo } from '../types';

export const HOUSE_ID = 'git-stars';
export const DEFAULT_AGENT_ID = 'git-stars:orchestrator';
export const EVENT_BUS_URL =
  import.meta.env.VITE_EVENT_BUS_URL || 'http://localhost:8085';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export function buildSystemPrompt(repo?: Repo | null): string {
  const context = repo
    ? `Current repo focus:
- Name: ${repo.author}/${repo.name}
- Stars: ${repo.stars}
- Forks: ${repo.forks}
- Open issues: ${repo.open_issues}
- Last updated: ${repo.last_updated}
- Topics: ${(repo.topics || []).slice(0, 8).join(', ') || 'none'}
- Languages: ${(repo.languages || []).map((l) => l.language).join(', ') || 'unknown'}`
    : 'No repo is currently selected.';

  return `You are the Git Stars Orchestrator. You help curate, analyze, and triage starred repositories.
You must rely on tools for factual repo data and summaries. Keep answers concise, structured, and actionable.
If a user asks for similar repos or research queue actions, call the appropriate tool.
${context}`;
}

export function buildGitStarsTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'list_starred_repos',
        description: 'List starred repositories with pagination and sorting.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max results (default 50)' },
            offset: { type: 'number', description: 'Offset for pagination' },
            sortBy: {
              type: 'string',
              enum: ['stars', 'forks', 'name', 'date'],
              description: 'Sort field (default stars)',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_repos',
        description: 'Search repos by name, description, author, or topics.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            language: { type: 'string', description: 'Optional language filter' },
            minStars: { type: 'number', description: 'Minimum stars' },
            maxResults: { type: 'number', description: 'Max results (default 50)' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_repo_details',
        description: 'Get detailed info about a repository.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Repository name' },
            author: { type: 'string', description: 'Repository owner (optional)' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_statistics',
        description: 'Get aggregate stats for all starred repos.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_language_breakdown',
        description: 'Get breakdown by programming language.',
        parameters: {
          type: 'object',
          properties: {
            topN: { type: 'number', description: 'Top N languages' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_trending_topics',
        description: 'Get most common topics across repos.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of topics to return' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'filter_by_criteria',
        description: 'Filter repositories by multiple criteria.',
        parameters: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            topic: { type: 'string' },
            license: { type: 'string' },
            minStars: { type: 'number' },
            maxStars: { type: 'number' },
            minForks: { type: 'number' },
            author: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_similar_repos',
        description: 'Find repositories similar to a given repo.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Repository name' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'mark_for_research',
        description: 'Add a repository to the research queue.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Repository name' },
            notes: { type: 'string', description: 'Optional notes' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_repos_missing_readme',
        description: 'List repositories missing a README file (best for Mine scope).',
        parameters: {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              enum: ['mine', 'starred'],
              description: 'Which repo set to inspect (default mine).',
            },
            limit: { type: 'number', description: 'Max results (default 50)' },
            offset: { type: 'number', description: 'Offset for pagination' },
            includeUnknown: {
              type: 'boolean',
              description: 'Include repos where README status is unknown',
            },
          },
        },
      },
    },
  ];
}

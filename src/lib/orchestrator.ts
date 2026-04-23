import type { Repo } from "../types";

export const HOUSE_ID = "git-stars";
export const DEFAULT_AGENT_ID = "git-stars:orchestrator";
export const EVENT_BUS_URL = import.meta.env.VITE_EVENT_BUS_URL || "/bus";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface GitStarsRoute {
  capability: string;
  agentId: string;
  label: string;
}

export interface ActionPreset {
  label: string;
  prompt: string;
  title: string;
  variant?: "primary" | "default";
}

const ROUTES: Array<{ pattern: RegExp; route: GitStarsRoute }> = [
  {
    pattern: /\b(search|find|filter|discover|similar|compare|topic)\b/i,
    route: {
      capability: "repo-discovery",
      agentId: "git-stars:repo-navigator",
      label: "Repository Navigator",
    },
  },
  {
    pattern: /\b(news|trend|stats|analytics|intelligence|signal|highlights)\b/i,
    route: {
      capability: "star-intelligence",
      agentId: "git-stars:repo-analyst",
      label: "Repository Analyst",
    },
  },
  {
    pattern: /\b(research|queue|adoption|align|house integration|fit)\b/i,
    route: {
      capability: "repo-research",
      agentId: "git-stars:alignment-scout",
      label: "Alignment Scout",
    },
  },
  {
    pattern: /\b(skill|rules|flows|codex|claude|mission|template)\b/i,
    route: {
      capability: "skill-extraction",
      agentId: "git-stars:tool-architect",
      label: "Tool Architect",
    },
  },
  {
    pattern: /\b(readme|maintain|maintenance|dependency|package|mine|private|repo ops)\b/i,
    route: {
      capability: "mine-execution",
      agentId: "git-stars:repo-ops",
      label: "Repo Ops",
    },
  },
];

export function routeGitStarsIntent(input: string, isMineContext = false): GitStarsRoute {
  if (isMineContext) {
    return {
      capability: "mine-execution",
      agentId: "git-stars:repo-ops",
      label: "Repo Ops",
    };
  }

  const match = ROUTES.find(({ pattern }) => pattern.test(input));
  return match?.route ?? {
    capability: "orchestration",
    agentId: DEFAULT_AGENT_ID,
    label: "Git Stars Orchestrator",
  };
}

export function buildSystemPrompt(repo?: Repo | null, route?: GitStarsRoute): string {
  const context = repo
    ? `Current repo focus:
- Name: ${repo.author}/${repo.name}
- Stars: ${repo.stars}
- Forks: ${repo.forks}
- Open issues: ${repo.open_issues}
- Last updated: ${repo.last_updated}
- Topics: ${(repo.topics || []).slice(0, 8).join(", ") || "none"}
- Languages: ${(repo.languages || []).map((entry) => entry.language).join(", ") || "unknown"}`
    : "No repo is currently selected.";

  const routeContext = route
    ? `Active route:
- Capability: ${route.capability}
- Agent: ${route.agentId}
- Label: ${route.label}`
    : "Active route: orchestrator default.";

  return `You are the Git Stars house. Work from canonical tools and derived house data, not generic guessing.
Always prefer typed tools over freeform inference when repo facts, queue state, adoption fit, skills, missions, or mine health are requested.
When a mission brief is requested, call generate_repo_mission.
When research state changes, call update_research_queue.
Keep answers concise, structured, and action-oriented.

${routeContext}

${context}`;
}

export function buildGitStarsTools() {
  return [
    {
      type: "function",
      function: {
        name: "list_starred_repos",
        description: "List starred repositories with pagination and sorting.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Max results (default 50)" },
            offset: { type: "number", description: "Offset for pagination" },
            sortBy: {
              type: "string",
              enum: ["stars", "forks", "name", "date"],
              description: "Sort field (default stars)",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "search_repos",
        description: "Search repos by name, description, author, or topics.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            language: { type: "string", description: "Optional language filter" },
            minStars: { type: "number", description: "Minimum stars" },
            maxResults: { type: "number", description: "Max results (default 50)" },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_repo_details",
        description: "Get detailed info about a repository.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Repository name" },
            author: { type: "string", description: "Repository owner (optional)" },
          },
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_statistics",
        description: "Get aggregate stats for all starred repos.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "get_language_breakdown",
        description: "Get breakdown by programming language.",
        parameters: {
          type: "object",
          properties: {
            topN: { type: "number", description: "Top N languages" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_trending_topics",
        description: "Get most common topics across repos.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of topics to return" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "filter_by_criteria",
        description: "Filter repositories by multiple criteria.",
        parameters: {
          type: "object",
          properties: {
            language: { type: "string" },
            topic: { type: "string" },
            license: { type: "string" },
            minStars: { type: "number" },
            maxStars: { type: "number" },
            minForks: { type: "number" },
            author: { type: "string" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "find_similar_repos",
        description: "Find repositories similar to a given repo.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Repository name" },
          },
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_news_signals",
        description: "Return ranked News tab signals for watched, research, mine, or starred scope.",
        parameters: {
          type: "object",
          properties: {
            scope: {
              type: "string",
              enum: ["watched", "research", "mine", "starred", "all"],
              description: "Signal scope (default watched)",
            },
            limit: { type: "number", description: "Maximum signals to return" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_research_queue",
        description: "Return the canonical research queue with optional status filtering.",
        parameters: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["queued", "researching", "done", "dismissed"],
              description: "Optional research status filter",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_research_queue",
        description: "Create or update a research queue item for a repository.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Repository name" },
            author: { type: "string", description: "Repository owner (optional)" },
            status: {
              type: "string",
              enum: ["queued", "researching", "done", "dismissed"],
              description: "Target status",
            },
            notes: { type: "string", description: "Queue notes" },
            priority: { type: "string", description: "Priority label" },
          },
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "mark_for_research",
        description: "Compatibility alias for update_research_queue with queued status.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Repository name" },
            author: { type: "string", description: "Repository owner (optional)" },
            notes: { type: "string", description: "Optional notes" },
          },
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_adoption_candidates",
        description: "Return top ranked repositories for house, tool, service, or template adoption.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum candidates to return" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "extract_repo_skills",
        description: "Return the canonical skill extraction record for a repository, including rules and flows.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Repository name" },
            author: { type: "string", description: "Repository owner (optional)" },
          },
          required: ["name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "generate_repo_mission",
        description: "Generate a canonical Codex or Claude mission brief for a repository.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Repository name" },
            author: { type: "string", description: "Repository owner (optional)" },
            target: {
              type: "string",
              enum: ["codex", "claude"],
              description: "Mission output target",
            },
          },
          required: ["name", "target"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_mine_health",
        description: "Return owned-repo health records for Mine workflows.",
        parameters: {
          type: "object",
          properties: {
            flag: { type: "string", description: "Optional health flag filter" },
            visibility: {
              type: "string",
              enum: ["public", "private"],
              description: "Optional visibility filter",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "find_repos_missing_readme",
        description: "List repositories missing a README file (best for Mine scope).",
        parameters: {
          type: "object",
          properties: {
            scope: {
              type: "string",
              enum: ["mine", "starred"],
              description: "Which repo set to inspect (default mine).",
            },
            limit: { type: "number", description: "Max results (default 50)" },
            offset: { type: "number", description: "Offset for pagination" },
            includeUnknown: {
              type: "boolean",
              description: "Include repos where README status is unknown",
            },
          },
        },
      },
    },
  ];
}

const GENERAL_ACTIONS: ActionPreset[] = [
  {
    label: "Research brief",
    title: "Research brief",
    prompt: "Use get_repo_details, get_research_queue, and extract_repo_skills to produce a short research brief with adoption fit and next actions.",
  },
  {
    label: "Adoption fit",
    title: "Adoption fit",
    prompt: "Use extract_repo_skills and get_adoption_candidates to classify this repo as a house, tool, service, template, or ignore candidate.",
  },
  {
    label: "Extract skills",
    title: "Extract skills",
    prompt: "Call extract_repo_skills and return the canonical skills, rules, flows, and adoption classification for this repo.",
  },
  {
    label: "Codex mission",
    title: "Codex mission",
    prompt: "Call generate_repo_mission with target codex and return the resulting mission brief.",
    variant: "primary",
  },
  {
    label: "Claude mission",
    title: "Claude mission",
    prompt: "Call generate_repo_mission with target claude and return the resulting mission brief.",
  },
  {
    label: "Template plan",
    title: "Template plan",
    prompt: "Use extract_repo_skills and get_mine_health if relevant, then explain whether this repo should become a reusable template and what would need to change.",
  },
  {
    label: "Maintenance plan",
    title: "Maintenance plan",
    prompt: "Use get_mine_health and extract_repo_skills to produce a maintenance and readiness plan for this repo.",
  },
];

const MINE_ACTIONS: ActionPreset[] = [
  {
    label: "Maintenance plan",
    title: "Maintenance plan",
    prompt: "Use get_mine_health and extract_repo_skills to produce a maintenance and execution plan for this owned repo.",
    variant: "primary",
  },
  {
    label: "Codex mission",
    title: "Codex mission",
    prompt: "Call generate_repo_mission with target codex and return the resulting mission brief.",
  },
  {
    label: "Claude mission",
    title: "Claude mission",
    prompt: "Call generate_repo_mission with target claude and return the resulting mission brief.",
  },
  {
    label: "Template plan",
    title: "Template plan",
    prompt: "Use extract_repo_skills and get_mine_health to decide whether this owned repo should be promoted into a reusable template.",
  },
  {
    label: "Adoption fit",
    title: "Adoption fit",
    prompt: "Use extract_repo_skills to explain how this owned repo fits into Git Stars adoption workflows.",
  },
  {
    label: "Extract skills",
    title: "Extract skills",
    prompt: "Call extract_repo_skills and return the canonical skills, rules, flows, and adoption classification for this repo.",
  },
];

export function getReadmeActionPresets(scope: "general" | "mine" = "general"): ActionPreset[] {
  return scope === "mine" ? MINE_ACTIONS : GENERAL_ACTIONS;
}

#!/usr/bin/env node

/**
 * MCP Server for git-stars
 * Provides tools for querying GitHub starred repositories via Model Context Protocol
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data file paths
const DATA_FILE = path.resolve(__dirname, "../../data/data.json");
const STATS_FILE = path.resolve(__dirname, "../../data/stats.json");
const RESEARCH_QUEUE_FILE = path.resolve(__dirname, "../../data/research-queue.json");
const MY_REPOS_FILE = path.resolve(__dirname, "../../data/my-repos.json");

/**
 * Load repository data from disk
 */
async function loadData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(content);

    // Handle both formats: grouped by language or flat array
    if (Array.isArray(data)) {
      // Check if it's grouped format
      if (data.length > 0 && data[0].repos) {
        return data.flatMap(group => group.repos || []);
      }
      return data;
    }
    return [];
  } catch (error) {
    console.error("Error loading data:", error.message);
    return [];
  }
}

/**
 * Load statistics from disk (if available)
 */
async function loadStats() {
  try {
    const content = await fs.readFile(STATS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Stats not available, will calculate on-demand");
    return null;
  }
}

/**
 * Load my repos data from disk (if available)
 */
async function loadMyRepos() {
  try {
    const content = await fs.readFile(MY_REPOS_FILE, "utf-8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("My repos not available, skipping");
    return [];
  }
}

/**
 * Append a research item to the queue
 */
async function addToResearchQueue(item) {
  try {
    let queue = [];
    try {
      const raw = await fs.readFile(RESEARCH_QUEUE_FILE, "utf-8");
      queue = JSON.parse(raw);
    } catch {
      queue = [];
    }
    queue.push({ ...item, timestamp: new Date().toISOString() });
    await fs.writeFile(RESEARCH_QUEUE_FILE, JSON.stringify(queue, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to write research queue:", error.message);
    return false;
  }
}

/**
 * Calculate statistics from repository data
 */
function calculateStats(repos) {
  const stats = {
    total_repos: repos.length,
    total_stars: 0,
    total_forks: 0,
    total_open_issues: 0,
    languages: {},
    topics: {},
    licenses: {},
    top_repos: [],
  };

  repos.forEach(repo => {
    stats.total_stars += repo.stars || 0;
    stats.total_forks += repo.forks || 0;
    stats.total_open_issues += repo.open_issues || 0;

    // Language breakdown
    const primaryLang = repo.primary_language || repo.language || "Unknown";
    stats.languages[primaryLang] = (stats.languages[primaryLang] || 0) + 1;

    // Topics frequency
    const topics = Array.isArray(repo.topics) ? repo.topics : [];
    topics.forEach(topic => {
      stats.topics[topic] = (stats.topics[topic] || 0) + 1;
    });

    // License breakdown
    const license = repo.license || "None";
    stats.licenses[license] = (stats.licenses[license] || 0) + 1;
  });

  // Get top 20 repos by stars
  stats.top_repos = repos
    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
    .slice(0, 20)
    .map(r => ({
      name: r.name,
      author: r.author,
      stars: r.stars,
      description: r.description,
      url: r.url,
    }));

  // Sort language and topic data by count
  stats.languages = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b - a)
    .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

  stats.topics = Object.entries(stats.topics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50) // Top 50 topics
    .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

  return stats;
}

/**
 * Search repositories by query
 */
function searchRepos(repos, query, options = {}) {
  const {
    language = null,
    minStars = 0,
    maxResults = 50,
  } = options;

  const searchTerm = query.toLowerCase();

  let results = repos.filter(repo => {
    // Text search
    const matchesQuery = !query ||
      repo.name?.toLowerCase().includes(searchTerm) ||
      repo.description?.toLowerCase().includes(searchTerm) ||
      repo.author?.toLowerCase().includes(searchTerm) ||
      (Array.isArray(repo.topics) && repo.topics.some(t => t.toLowerCase().includes(searchTerm)));

    // Language filter
    const matchesLanguage = !language ||
      repo.primary_language === language ||
      repo.language === language;

    // Stars filter
    const matchesStars = (repo.stars || 0) >= minStars;

    return matchesQuery && matchesLanguage && matchesStars;
  });

  // Sort by stars descending
  results.sort((a, b) => (b.stars || 0) - (a.stars || 0));

  return results.slice(0, maxResults);
}

/**
 * Filter repositories by criteria
 */
function filterRepos(repos, criteria = {}) {
  const {
    language = null,
    topic = null,
    license = null,
    minStars = 0,
    maxStars = Infinity,
    minForks = 0,
    author = null,
  } = criteria;

  return repos.filter(repo => {
    const matchesLanguage = !language ||
      repo.primary_language === language ||
      repo.language === language;

    const matchesTopic = !topic ||
      (Array.isArray(repo.topics) && repo.topics.includes(topic));

    const matchesLicense = !license || repo.license === license;

    const stars = repo.stars || 0;
    const matchesStars = stars >= minStars && stars <= maxStars;

    const matchesForks = (repo.forks || 0) >= minForks;

    const matchesAuthor = !author || repo.author === author;

    return matchesLanguage && matchesTopic && matchesLicense &&
           matchesStars && matchesForks && matchesAuthor;
  });
}

/**
 * Find similar repositories (lightweight token overlap)
 */
function findSimilarRepos(repos, targetName) {
  const target = repos.find(
    (r) => (r.name || "").toLowerCase() === (targetName || "").toLowerCase()
  );
  if (!target) return [];

  const tokens = new Set(
    [
      target.name,
      target.description || "",
      (target.author || "") + "/" + target.name,
      ...(Array.isArray(target.topics) ? target.topics : []),
      target.primary_language || target.language || "",
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3)
  );

  const scored = repos
    .filter((r) => r.name !== target.name)
    .map((r) => {
      const text = [
        r.name,
        r.description || "",
        (r.author || "") + "/" + r.name,
        ...(Array.isArray(r.topics) ? r.topics : []),
        r.primary_language || r.language || "",
      ]
        .join(" ")
        .toLowerCase();
      let score = 0;
      tokens.forEach((t) => {
        if (text.includes(t)) score += 1;
      });
      return { repo: r, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 8).map((s) => s.repo);
}

/**
 * Main MCP Server
 */
class GitStarsServer {
  constructor() {
    this.server = new Server(
      {
        name: "git-stars-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.repos = [];
    this.myRepos = [];
    this.stats = null;

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_starred_repos",
          description: "List all starred GitHub repositories with optional pagination",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of repos to return (default: 50)",
                default: 50,
              },
              offset: {
                type: "number",
                description: "Number of repos to skip (default: 0)",
                default: 0,
              },
              sortBy: {
                type: "string",
                description: "Sort field: stars, forks, name, date (default: stars)",
                enum: ["stars", "forks", "name", "date"],
                default: "stars",
              },
            },
          },
        },
        {
          name: "search_repos",
          description: "Search repositories by name, description, author, or topics",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query string",
              },
              language: {
                type: "string",
                description: "Filter by programming language (optional)",
              },
              minStars: {
                type: "number",
                description: "Minimum number of stars (default: 0)",
                default: 0,
              },
              maxResults: {
                type: "number",
                description: "Maximum results to return (default: 50)",
                default: 50,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_repo_details",
          description: "Get detailed information about a specific repository",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Repository name",
              },
              author: {
                type: "string",
                description: "Repository author/owner (optional)",
              },
            },
            required: ["name"],
          },
        },
        {
          name: "get_statistics",
          description: "Get comprehensive statistics about all starred repositories",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_language_breakdown",
          description: "Get breakdown of repositories by programming language",
          inputSchema: {
            type: "object",
            properties: {
              topN: {
                type: "number",
                description: "Return top N languages (default: 20)",
                default: 20,
              },
            },
          },
        },
        {
          name: "get_trending_topics",
          description: "Get the most popular topics across starred repositories",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of topics to return (default: 20)",
                default: 20,
              },
            },
          },
        },
        {
          name: "filter_by_criteria",
          description: "Filter repositories by multiple criteria",
          inputSchema: {
            type: "object",
            properties: {
              language: {
                type: "string",
                description: "Programming language",
              },
              topic: {
                type: "string",
                description: "Topic/tag",
              },
              license: {
                type: "string",
                description: "License type",
              },
              minStars: {
                type: "number",
                description: "Minimum stars",
              },
              maxStars: {
                type: "number",
                description: "Maximum stars",
              },
              minForks: {
                type: "number",
                description: "Minimum forks",
              },
              author: {
                type: "string",
                description: "Repository author",
              },
            },
          },
        },
        {
          name: "find_similar_repos",
          description: "Find repositories similar to a given one",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Repository name" },
            },
            required: ["name"],
          },
        },
        {
          name: "mark_for_research",
          description: "Add a repository to the research queue with optional notes",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Repository name" },
              notes: { type: "string", description: "Research notes" },
            },
            required: ["name"],
          },
        },
        {
          name: "find_repos_missing_readme",
          description: "List repositories missing a README file (best for Mine scope).",
          inputSchema: {
            type: "object",
            properties: {
              scope: {
                type: "string",
                enum: ["mine", "starred"],
                description: "Which repo set to inspect (default: mine)",
                default: "mine",
              },
              limit: {
                type: "number",
                description: "Maximum number of repos to return (default: 50)",
                default: 50,
              },
              offset: {
                type: "number",
                description: "Number of repos to skip (default: 0)",
                default: 0,
              },
              includeUnknown: {
                type: "boolean",
                description: "Include repos with unknown README status",
                default: false,
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_starred_repos":
            return await this.handleListRepos(args);
          case "search_repos":
            return await this.handleSearch(args);
          case "get_repo_details":
            return await this.handleGetDetails(args);
          case "get_statistics":
            return await this.handleGetStats(args);
          case "get_language_breakdown":
            return await this.handleGetLanguages(args);
          case "get_trending_topics":
            return await this.handleGetTopics(args);
          case "filter_by_criteria":
            return await this.handleFilter(args);
          case "find_similar_repos":
            return await this.handleFindSimilar(args);
          case "mark_for_research":
            return await this.handleMarkForResearch(args);
          case "find_repos_missing_readme":
            return await this.handleMissingReadme(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: error.message }),
            },
          ],
        };
      }
    });
  }

  async handleListRepos(args) {
    const { limit = 50, offset = 0, sortBy = "stars" } = args;

    let sorted = [...this.repos];

    switch (sortBy) {
      case "stars":
        sorted.sort((a, b) => (b.stars || 0) - (a.stars || 0));
        break;
      case "forks":
        sorted.sort((a, b) => (b.forks || 0) - (a.forks || 0));
        break;
      case "name":
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "date":
        sorted.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        break;
    }

    const results = sorted.slice(offset, offset + limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total: this.repos.length,
            offset,
            limit,
            count: results.length,
            repositories: results,
          }, null, 2),
        },
      ],
    };
  }

  async handleSearch(args) {
    const results = searchRepos(this.repos, args.query, args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            query: args.query,
            count: results.length,
            repositories: results,
          }, null, 2),
        },
      ],
    };
  }

  async handleGetDetails(args) {
    const { name, author } = args;

    const repo = this.repos.find(r => {
      const matchesName = r.name === name;
      const matchesAuthor = !author || r.author === author;
      return matchesName && matchesAuthor;
    });

    if (!repo) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Repository not found" }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(repo, null, 2),
        },
      ],
    };
  }

  async handleGetStats(args) {
    if (!this.stats) {
      this.stats = calculateStats(this.repos);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(this.stats, null, 2),
        },
      ],
    };
  }

  async handleGetLanguages(args) {
    const { topN = 20 } = args;

    if (!this.stats) {
      this.stats = calculateStats(this.repos);
    }

    const languages = Object.entries(this.stats.languages)
      .slice(0, topN)
      .map(([language, count]) => ({
        language,
        count,
        percentage: ((count / this.repos.length) * 100).toFixed(2) + "%",
      }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ languages }, null, 2),
        },
      ],
    };
  }

  async handleGetTopics(args) {
    const { limit = 20 } = args;

    if (!this.stats) {
      this.stats = calculateStats(this.repos);
    }

    const topics = Object.entries(this.stats.topics)
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ topics }, null, 2),
        },
      ],
    };
  }

  async handleFilter(args) {
    const results = filterRepos(this.repos, args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            criteria: args,
            count: results.length,
            repositories: results,
          }, null, 2),
        },
      ],
    };
  }

  async handleFindSimilar(args) {
    const results = findSimilarRepos(this.repos, args.name);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              name: args.name,
              count: results.length,
              repositories: results,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async handleMarkForResearch(args) {
    const success = await addToResearchQueue({
      repo: args.name,
      notes: args.notes || "",
      by: "git-stars-mcp",
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success,
              name: args.name,
              notes: args.notes || "",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async handleMissingReadme(args) {
    const {
      scope = "mine",
      limit = 50,
      offset = 0,
      includeUnknown = false,
    } = args || {};

    const source =
      scope === "starred"
        ? this.repos
        : this.myRepos.filter((repo) => repo.is_owner !== false);
    if (!source || source.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                scope,
                count: 0,
                repositories: [],
                error: "No repositories loaded for this scope.",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const missing = source.filter((repo) => {
      if (repo.has_readme === false) return true;
      if (includeUnknown && (repo.has_readme === null || repo.has_readme === undefined)) return true;
      return false;
    });

    const results = missing.slice(offset, offset + limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              scope,
              total: source.length,
              missing_count: missing.length,
              offset,
              limit,
              count: results.length,
              repositories: results,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    // Load data
    console.error("Loading repository data...");
    this.repos = await loadData();
    console.error(`Loaded ${this.repos.length} repositories`);
    this.myRepos = await loadMyRepos();
    if (this.myRepos.length) {
      console.error(`Loaded ${this.myRepos.length} my repos`);
    }

    // Try to load pre-computed stats
    this.stats = await loadStats();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Server running on stdio");
  }
}

// Start server
const server = new GitStarsServer();
server.run().catch(console.error);

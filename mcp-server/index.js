#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs-extra";
import path from "path";
import { z } from "zod";
import { fileURLToPath } from "url";

// Paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOUSE_ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(HOUSE_ROOT, "public", "data.json"); // Read-only source
const RESEARCH_QUEUE_PATH = path.join(HOUSE_ROOT, "data", "research-queue.json");
const ENRICHED_DATA_PATH = path.join(HOUSE_ROOT, "data", "enriched-data.json");

// Cache
let REPO_CACHE = [];

// Helper: Load Data
async function loadData() {
  try {
    if (await fs.pathExists(DATA_PATH)) {
      const raw = await fs.readJson(DATA_PATH);
      REPO_CACHE = Array.isArray(raw) ? raw : [];
    }
  } catch (error) {
    console.error("Error loading repo data:", error);
  }
}

// Helper: Append to Queue
async function addToQueue(item) {
  try {
    let queue = [];
    if (await fs.pathExists(RESEARCH_QUEUE_PATH)) {
      queue = await fs.readJson(RESEARCH_QUEUE_PATH);
    }
    queue.push({ ...item, timestamp: new Date().toISOString() });
    await fs.writeJson(RESEARCH_QUEUE_PATH, queue, { spaces: 2 });
    return true;
  } catch (e) {
    return false;
  }
}

// Helper: Similarity (Simple Token overlap)
function findSimilar(targetName) {
  const target = REPO_CACHE.find(r => r.name.toLowerCase() === targetName.toLowerCase());
  if (!target) return [];

  const targetTokens = new Set([
    ...target.name.toLowerCase().split(/[-_]/),
    ...(target.description || "").toLowerCase().split(/\s+/),
    ...(target.language ? [target.language.toLowerCase()] : [])
  ]);

  return REPO_CACHE
    .filter(r => r.name !== target.name)
    .map(r => {
      const startTokens = new Set([
        ...r.name.toLowerCase().split(/[-_]/),
        ...(r.description || "").toLowerCase().split(/\s+/),
        ...(r.language ? [r.language.toLowerCase()] : [])
      ]);
      // Intersection
      let overlap = 0;
      targetTokens.forEach(t => { if (startTokens.has(t) && t.length > 3) overlap++; });
      return { repo: r, score: overlap };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(match => match.repo);
}

// Server Setup
const server = new Server(
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

// Tool Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_starred_repos",
        description: "List repositories with pagination",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", default: 20 },
            offset: { type: "number", default: 0 }
          }
        }
      },
      {
        name: "search_repos",
        description: "Search repos by query and language",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            language: { type: "string" }
          },
          required: ["query"]
        }
      },
      {
        name: "get_repo_details",
        description: "Get detailed info for a specific repo",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" }
          },
          required: ["name"]
        }
      },
      {
        name: "get_statistics",
        description: "Get aggregate statistics",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "find_similar_repos",
        description: "Find repositories similar to a given one",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" }
          },
          required: ["name"]
        }
      },
      {
        name: "mark_for_research",
        description: "Mark a repository for deeper research/alignment",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            notes: { type: "string" }
          },
          required: ["name"]
        }
      },
      {
        name: "generate_skill_scaffold",
        description: "Generate a markdown scaffold for a Skill",
        inputSchema: {
          type: "object",
          properties: {
            repo_name: { type: "string" },
            capabilities: { type: "array", items: { type: "string" } }
          },
          required: ["repo_name", "capabilities"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await loadData(); // Reload data on call
  
  const { name, arguments: args } = request.params;

  if (name === "list_starred_repos") {
    const limit = args.limit || 20;
    const offset = args.offset || 0;
    return {
      content: [{ type: "text", text: JSON.stringify(REPO_CACHE.slice(offset, offset + limit), null, 2) }]
    };
  }

  if (name === "search_repos") {
    const query = (args.query || "").toLowerCase();
    const lang = (args.language || "").toLowerCase();
    const results = REPO_CACHE.filter(r => {
      const matchQuery = r.name.toLowerCase().includes(query) || (r.description || "").toLowerCase().includes(query);
      const matchLang = lang ? (r.language || "").toLowerCase() === lang : true;
      return matchQuery && matchLang;
    });
    return {
      content: [{ type: "text", text: JSON.stringify(results.slice(0, 20), null, 2) }]
    };
  }

  if (name === "get_repo_details") {
    const repo = REPO_CACHE.find(r => r.name.toLowerCase() === (args.name || "").toLowerCase());
    if (!repo) return { isError: true, content: [{ type: "text", text: "Repo not found" }] };
    return { content: [{ type: "text", text: JSON.stringify(repo, null, 2) }] };
  }

  if (name === "get_statistics") {
    const total = REPO_CACHE.length;
    const langs = {};
    REPO_CACHE.forEach(r => { if(r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
    const topLangs = Object.entries(langs).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
      content: [{ type: "text", text: JSON.stringify({ total, top_languages: topLangs }, null, 2) }]
    };
  }

  if (name === "find_similar_repos") {
    const similar = findSimilar(args.name);
    return { content: [{ type: "text", text: JSON.stringify(similar.map(r => r.name), null, 2) }] };
  }

  if (name === "mark_for_research") {
    const success = await addToQueue({ 
      repo: args.name, 
      notes: args.notes,
      by: "mcp-server" 
    });
    return { content: [{ type: "text", text: success ? `Marked ${args.name} for research.` : "Failed to write queue." }] };
  }

  if (name === "generate_skill_scaffold") {
    const scaffold = `
# Skill: ${args.repo_name}
## Description
Generated from repository capabilities.

## Tools
${(args.capabilities || []).map(c => `- ${c}`).join('\n')}

## Implementation
TODO: Map these capabilities to CLI commands or API calls.
`;
    return { content: [{ type: "text", text: scaffold.trim() }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start Server
const transport = new StdioServerTransport();
await server.connect(transport);

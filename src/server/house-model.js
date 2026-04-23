import fs from "fs/promises";
import path from "path";

const DATA_FILE = "data.json";
const MY_REPOS_FILE = "my-repos.json";
const RESEARCH_QUEUE_FILE = "research-queue.json";
const REPO_SIGNALS_FILE = "repo-signals.json";
const SKILL_EXTRACTIONS_FILE = "skill-extractions.json";
const MINE_HEALTH_FILE = "mine-health.json";

const RESEARCH_STATUSES = new Set(["queued", "researching", "done", "dismissed"]);
const ADOPTION_KINDS = new Set(["house", "tool", "service", "template", "ignore"]);

const CAPABILITY_RULES = [
  { capability: "mcp-tooling", keywords: ["mcp", "model context protocol", "tool calling", "tool-calling"] },
  { capability: "agent-workflows", keywords: ["agent", "orchestrator", "workflow", "subagent", "assistant"] },
  { capability: "research-intelligence", keywords: ["research", "paper", "benchmark", "evaluation", "survey", "knowledge"] },
  { capability: "template-scaffolding", keywords: ["template", "starter", "boilerplate", "scaffold", "kickstart"] },
  { capability: "frontend-ui", keywords: ["react", "next", "frontend", "ui", "dashboard", "webapp", "vite", "design-system"] },
  { capability: "backend-service", keywords: ["api", "backend", "server", "service", "runtime", "gateway"] },
  { capability: "developer-tooling", keywords: ["cli", "sdk", "library", "plugin", "extension", "tooling"] },
  { capability: "ml-ai", keywords: ["llm", "ml", "ai", "machine-learning", "inference", "model", "prompt", "quantization"] },
  { capability: "data-pipeline", keywords: ["data", "etl", "pipeline", "sync", "crawler", "scrape", "index"] },
  { capability: "repo-ops", keywords: ["ci", "cd", "github-actions", "automation", "maintenance", "dependency"] },
];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function repoNwo(repo) {
  return `${repo.author}/${repo.name}`;
}

function nwoKey(nwo) {
  return String(nwo || "").trim().toLowerCase();
}

function parseDate(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

function repoUpdatedAt(repo) {
  return parseDate(repo.last_updated_at)
    ?? parseDate(repo.last_updated)
    ?? parseDate(repo.date)
    ?? parseDate(repo.created_at)
    ?? new Date(0);
}

function repoText(repo) {
  return [
    repo.name,
    repo.description || "",
    repo.author || "",
    repo.primary_language || "",
    repo.language || "",
    ...toArray(repo.topics),
    ...toArray(repo.languages).map((entry) => entry.language),
  ]
    .join(" ")
    .toLowerCase();
}

function repoTokens(repo) {
  return new Set(
    repoText(repo)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 1),
  );
}

function keywordMatches(text, tokens, keyword) {
  if (keyword.includes(" ") || keyword.includes("-")) {
    return text.includes(keyword);
  }
  if (keyword.length <= 3) {
    return tokens.has(keyword);
  }
  return text.includes(keyword);
}

function deriveCapabilities(repo) {
  const text = repoText(repo);
  const tokens = repoTokens(repo);
  const capabilities = CAPABILITY_RULES
    .filter((rule) => rule.keywords.some((keyword) => keywordMatches(text, tokens, keyword)))
    .map((rule) => rule.capability);

  if ((repo.primary_language || repo.language) === "TypeScript") {
    capabilities.push("frontend-ui");
  }

  if ((repo.primary_language || repo.language) === "Python") {
    capabilities.push("ml-ai");
  }

  return unique(capabilities).slice(0, 8);
}

function classifyAdoptionKind(repo, capabilities) {
  const text = repoText(repo);

  if (text.includes("template") || text.includes("starter") || text.includes("boilerplate") || capabilities.includes("template-scaffolding")) {
    return "template";
  }

  if (
    text.includes("mcp")
    || text.includes("sdk")
    || text.includes("library")
    || text.includes("plugin")
    || text.includes("extension")
    || capabilities.includes("developer-tooling")
  ) {
    return "tool";
  }

  if (
    text.includes("api")
    || text.includes("server")
    || text.includes("service")
    || text.includes("runtime")
    || text.includes("gateway")
    || capabilities.includes("backend-service")
  ) {
    return "service";
  }

  if (
    text.includes("app")
    || text.includes("dashboard")
    || text.includes("studio")
    || text.includes("frontend")
    || text.includes("ui")
    || capabilities.includes("frontend-ui")
  ) {
    return "house";
  }

  if (capabilities.length > 0) {
    return "tool";
  }

  return "ignore";
}

function computeStaleness(repo) {
  const updatedAt = repoUpdatedAt(repo);
  const ageDays = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays <= 90) return "active";
  if (ageDays <= 365) return "watch";
  return "stale";
}

function computeAdoptionScore(repo, capabilities, adoptionKind, isMine) {
  const updatedAt = repoUpdatedAt(repo);
  const ageDays = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const stars = Number(repo.stars || 0);
  const forks = Number(repo.forks || 0);
  const hasLicense = !!repo.license && repo.license !== "None" && repo.license !== "NOASSERTION";
  const hasReadme = repo.has_readme !== false;

  let score = 15;
  score += Math.min(25, Math.log10(stars + 1) * 8);
  score += Math.min(10, Math.log10(forks + 1) * 4);
  score += capabilities.length * 5;
  score += hasLicense ? 8 : -4;
  score += hasReadme ? 6 : -6;
  score += ageDays <= 90 ? 15 : ageDays <= 365 ? 8 : -5;

  if (adoptionKind === "template") score += 10;
  if (adoptionKind === "tool") score += 8;
  if (adoptionKind === "service") score += 6;
  if (adoptionKind === "ignore") score -= 12;
  if (isMine) score += 10;

  return clamp(Math.round(score), 0, 100);
}

function deriveHouseSkills(repo, capabilities, adoptionKind, isMine) {
  const skills = [];

  if (capabilities.some((capability) => ["developer-tooling", "data-pipeline", "frontend-ui"].includes(capability))) {
    skills.push("repo-discovery");
  }
  if (capabilities.includes("research-intelligence") || repoText(repo).includes("research") || repoText(repo).includes("benchmark")) {
    skills.push("repo-research");
  }
  if (capabilities.some((capability) => ["mcp-tooling", "agent-workflows", "template-scaffolding", "developer-tooling"].includes(capability))) {
    skills.push("skill-extraction");
  }
  if (adoptionKind !== "ignore") {
    skills.push("repo-adoption");
  }
  if (isMine || capabilities.includes("repo-ops")) {
    skills.push("mine-execution");
  }

  return unique(skills);
}

function deriveRules(repo, adoptionKind, staleness, isMine) {
  const rules = [];

  if (adoptionKind === "template") {
    rules.push("Adopt this as a scaffold or reference, not as a long-lived runtime dependency.");
  }
  if (adoptionKind === "tool") {
    rules.push("Prefer wrapping the repo behind a narrow interface instead of spreading its assumptions across the house.");
  }
  if (adoptionKind === "service") {
    rules.push("Treat external runtimes and APIs as configurable integrations with explicit environment requirements.");
  }
  if (repo.license === "None" || repo.license === "NOASSERTION") {
    rules.push("Review license status before adoption or redistribution work.");
  }
  if (staleness === "stale") {
    rules.push("Validate maintenance risk and current ecosystem fit before committing to adoption.");
  }
  if (isMine) {
    rules.push("Prioritize README, maintenance, and execution readiness before broader ecosystem integration.");
  }

  return unique(rules).slice(0, 4);
}

function deriveFlows(adoptionKind, houseSkills, isMine, researchStatus) {
  const flows = [];

  if (researchStatus === "queued" || researchStatus === "researching") {
    flows.push("research-queue-flow");
  }
  if (houseSkills.includes("skill-extraction")) {
    flows.push("skill-extraction-flow");
  }
  if (houseSkills.includes("repo-adoption")) {
    flows.push("adoption-decision-flow");
  }
  if (houseSkills.includes("repo-discovery")) {
    flows.push("news-digest-refresh");
  }
  if (isMine || houseSkills.includes("mine-execution")) {
    flows.push("mine-execution-flow");
  }
  if (adoptionKind === "ignore" && !flows.includes("research-queue-flow")) {
    flows.push("research-queue-flow");
  }

  return unique(flows);
}

function buildMissionBrief(extraction, target) {
  const label = target === "claude" ? "Claude" : "Codex";
  const steps = extraction.flows.map((flow, index) => `${index + 1}. ${flow}`).join("\n");
  const rules = extraction.rules.map((rule) => `- ${rule}`).join("\n");
  const skills = extraction.houseSkills.join(", ") || "none";
  const capabilities = extraction.capabilities.join(", ") || "none";

  return [
    `# ${label} Mission: ${extraction.nwo}`,
    `Goal: ${extraction.summary}`,
    `Classification: ${extraction.adoptionKind}`,
    `Capabilities: ${capabilities}`,
    `House skills: ${skills}`,
    "Rules:",
    rules || "- Keep scope narrow and evidence-based.",
    "Flow:",
    steps || "1. research-queue-flow",
    `Deliverable: produce an actionable ${label.toLowerCase()}-ready plan grounded in the repo's capabilities and adoption fit.`,
  ].join("\n");
}

function buildSummary(repo, adoptionKind, houseSkills, capabilities) {
  const firstSkill = houseSkills[0] || "repo-discovery";
  const firstCapability = capabilities[0] || "general engineering";
  const description = repo.description && repo.description !== "No description"
    ? repo.description
    : `${repo.name} is a candidate for ${adoptionKind} adoption.`;

  return `${description} Primary Git Stars fit: ${firstSkill} via ${firstCapability}.`;
}

function buildResearchReasons(repo, extraction, staleness, isMine) {
  const reasons = [
    `Adoption kind: ${extraction.adoptionKind}`,
    `Primary skills: ${extraction.houseSkills.join(", ") || "repo-discovery"}`,
  ];

  if (staleness === "active") {
    reasons.push("Recent activity suggests the repo is still moving.");
  } else if (staleness === "watch") {
    reasons.push("Medium-term activity suggests this repo should stay on the watchlist.");
  } else {
    reasons.push("Stale activity suggests higher maintenance risk.");
  }

  if (isMine) {
    reasons.push("This repo is owned or directly maintained and belongs in the execution workspace.");
  }

  return unique(reasons).slice(0, 4);
}

function buildSkillExtraction(repo, queueItem, isMine) {
  const capabilities = deriveCapabilities(repo);
  const adoptionKind = classifyAdoptionKind(repo, capabilities);
  const staleness = computeStaleness(repo);
  const houseSkills = deriveHouseSkills(repo, capabilities, adoptionKind, isMine);
  const rules = deriveRules(repo, adoptionKind, staleness, isMine);
  const flows = deriveFlows(adoptionKind, houseSkills, isMine, queueItem?.status ?? "queued");
  const summary = buildSummary(repo, adoptionKind, houseSkills, capabilities);

  const extraction = {
    nwo: repoNwo(repo),
    name: repo.name,
    author: repo.author,
    summary,
    capabilities,
    houseSkills,
    rules,
    flows,
    adoptionKind,
  };

  return {
    ...extraction,
    codexBrief: buildMissionBrief(extraction, "codex"),
    claudeBrief: buildMissionBrief(extraction, "claude"),
  };
}

function buildMineHealth(repo, extraction) {
  const updatedAt = repoUpdatedAt(repo).toISOString();
  const healthFlags = [];
  const recommendedActions = ["codex-mission", "claude-mission"];

  if (repo.has_readme === false) {
    healthFlags.push("missing-readme");
    recommendedActions.push("write-readme");
  }

  if (computeStaleness(repo) === "stale") {
    healthFlags.push("stale");
    recommendedActions.push("maintenance-plan");
  }

  if (repo.private) {
    healthFlags.push("private");
  }

  if (repo.is_fork) {
    healthFlags.push("fork");
  }

  if (extraction.adoptionKind === "template") {
    healthFlags.push("template-candidate");
    recommendedActions.push("template-plan");
  }

  if (extraction.adoptionKind !== "ignore") {
    recommendedActions.push("house-integration");
  }

  return {
    nwo: repoNwo(repo),
    name: repo.name,
    author: repo.author,
    visibility: repo.private ? "private" : "public",
    hasReadme: repo.has_readme ?? null,
    updatedAt,
    healthFlags: unique(healthFlags),
    recommendedActions: unique(recommendedActions),
  };
}

function buildRepoSignal(repo, extraction, queueItem, isMine) {
  const staleness = computeStaleness(repo);
  const adoptionScore = computeAdoptionScore(repo, extraction.capabilities, extraction.adoptionKind, isMine);

  return {
    nwo: repoNwo(repo),
    name: repo.name,
    author: repo.author,
    description: repo.description,
    scope: queueItem ? "research" : isMine ? "mine" : "starred",
    lastActivityAt: repoUpdatedAt(repo).toISOString(),
    staleness,
    researchStatus: queueItem?.status ?? "untracked",
    adoptionScore,
    adoptionKind: extraction.adoptionKind,
    reasons: buildResearchReasons(repo, extraction, staleness, isMine),
    houseSkills: extraction.houseSkills,
    capabilities: extraction.capabilities,
  };
}

function compareSignals(a, b) {
  if (a.scope !== b.scope) {
    const priority = { research: 0, mine: 1, starred: 2 };
    return priority[a.scope] - priority[b.scope];
  }

  if (a.adoptionScore !== b.adoptionScore) {
    return b.adoptionScore - a.adoptionScore;
  }

  return Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
}

function normalizeQueueItem(rawItem, repoIndex) {
  const repo = rawItem.nwo
    ? repoIndex.get(nwoKey(rawItem.nwo))
    : rawItem.repo
      ? [...repoIndex.values()].find((entry) => entry.name.toLowerCase() === String(rawItem.repo).toLowerCase())
      : null;

  const nwo = rawItem.nwo || (repo ? repoNwo(repo) : rawItem.repo || "unknown/unknown");
  const status = RESEARCH_STATUSES.has(rawItem.status) ? rawItem.status : "queued";
  const priority = typeof rawItem.priority === "string" ? rawItem.priority : "normal";
  const createdAt = rawItem.createdAt || rawItem.timestamp || new Date().toISOString();
  const updatedAt = rawItem.updatedAt || rawItem.timestamp || createdAt;

  return {
    nwo,
    status,
    priority,
    notes: rawItem.notes || "",
    createdAt,
    updatedAt,
  };
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function resolveDataPaths(rootDir) {
  return {
    dataDir: path.join(rootDir, "data"),
    publicDir: path.join(rootDir, "public"),
  };
}

export async function loadHouseDatasets(rootDir) {
  const { dataDir, publicDir } = resolveDataPaths(rootDir);
  const starredRepos = await readJson(path.join(dataDir, DATA_FILE), null)
    ?? await readJson(path.join(publicDir, DATA_FILE), []);
  const myRepos = await readJson(path.join(dataDir, MY_REPOS_FILE), null)
    ?? await readJson(path.join(publicDir, MY_REPOS_FILE), []);
  const researchQueue = await readJson(path.join(dataDir, RESEARCH_QUEUE_FILE), null)
    ?? await readJson(path.join(publicDir, RESEARCH_QUEUE_FILE), []);

  return {
    starredRepos: Array.isArray(starredRepos) ? starredRepos : [],
    myRepos: Array.isArray(myRepos) ? myRepos : [],
    researchQueue: Array.isArray(researchQueue) ? researchQueue : [],
  };
}

export function buildDerivedHouseData({ starredRepos, myRepos, researchQueue }) {
  const repoMap = new Map();
  const mineKeys = new Set();

  for (const repo of toArray(starredRepos)) {
    repoMap.set(nwoKey(repoNwo(repo)), repo);
  }

  for (const repo of toArray(myRepos)) {
    const key = nwoKey(repoNwo(repo));
    repoMap.set(key, repo);
    mineKeys.add(key);
  }

  const normalizedQueue = toArray(researchQueue).map((item) => normalizeQueueItem(item, repoMap));
  const queueMap = new Map(normalizedQueue.map((item) => [nwoKey(item.nwo), item]));

  const skillExtractions = [];
  const repoSignals = [];
  const mineHealth = [];

  for (const repo of repoMap.values()) {
    const key = nwoKey(repoNwo(repo));
    const extraction = buildSkillExtraction(repo, queueMap.get(key), mineKeys.has(key));
    skillExtractions.push(extraction);
    repoSignals.push(buildRepoSignal(repo, extraction, queueMap.get(key), mineKeys.has(key)));

    if (mineKeys.has(key)) {
      mineHealth.push(buildMineHealth(repo, extraction));
    }
  }

  return {
    researchQueue: normalizedQueue.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    repoSignals: repoSignals.sort(compareSignals),
    skillExtractions: skillExtractions.sort((a, b) => a.nwo.localeCompare(b.nwo)),
    mineHealth: mineHealth.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
  };
}

export async function writeDerivedHouseData(rootDir, payload) {
  const { dataDir, publicDir } = resolveDataPaths(rootDir);
  const outputs = [
    [RESEARCH_QUEUE_FILE, payload.researchQueue],
    [REPO_SIGNALS_FILE, payload.repoSignals],
    [SKILL_EXTRACTIONS_FILE, payload.skillExtractions],
    [MINE_HEALTH_FILE, payload.mineHealth],
  ];

  for (const [filename, data] of outputs) {
    await writeJson(path.join(dataDir, filename), data);
    await writeJson(path.join(publicDir, filename), data);
  }
}

export async function generateDerivedHouseData(rootDir, overrides = {}) {
  const datasets = await loadHouseDatasets(rootDir);
  const payload = buildDerivedHouseData({
    starredRepos: overrides.starredRepos ?? datasets.starredRepos,
    myRepos: overrides.myRepos ?? datasets.myRepos,
    researchQueue: overrides.researchQueue ?? datasets.researchQueue,
  });

  await writeDerivedHouseData(rootDir, payload);
  return payload;
}

export async function updateResearchQueue(rootDir, { nwo, status = "queued", notes = "", priority = "normal" }) {
  const datasets = await loadHouseDatasets(rootDir);
  const nextStatus = RESEARCH_STATUSES.has(status) ? status : "queued";
  const timestamp = new Date().toISOString();
  const nextQueue = buildDerivedHouseData(datasets).researchQueue;
  const key = nwoKey(nwo);
  const existingIndex = nextQueue.findIndex((item) => nwoKey(item.nwo) === key);

  if (existingIndex >= 0) {
    nextQueue[existingIndex] = {
      ...nextQueue[existingIndex],
      status: nextStatus,
      priority,
      notes: notes || nextQueue[existingIndex].notes,
      updatedAt: timestamp,
    };
  } else {
    nextQueue.unshift({
      nwo,
      status: nextStatus,
      priority,
      notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  const payload = await generateDerivedHouseData(rootDir, {
    starredRepos: datasets.starredRepos,
    myRepos: datasets.myRepos,
    researchQueue: nextQueue,
  });

  return payload.researchQueue.find((item) => nwoKey(item.nwo) === key) ?? null;
}

export function resolveRepoRecord({ name, author }, datasets) {
  const repos = [...toArray(datasets.myRepos), ...toArray(datasets.starredRepos)];
  return repos.find((repo) => {
    const matchesName = repo.name.toLowerCase() === String(name || "").toLowerCase();
    const matchesAuthor = !author || repo.author.toLowerCase() === String(author).toLowerCase();
    return matchesName && matchesAuthor;
  }) ?? null;
}

export function findSkillExtraction(skillExtractions, nwo) {
  return toArray(skillExtractions).find((item) => nwoKey(item.nwo) === nwoKey(nwo)) ?? null;
}

export function listAdoptionCandidates(repoSignals, limit = 10) {
  return toArray(repoSignals)
    .filter((signal) => ADOPTION_KINDS.has(signal.adoptionKind) && signal.adoptionKind !== "ignore")
    .sort((a, b) => b.adoptionScore - a.adoptionScore)
    .slice(0, limit);
}

export function listNewsSignals(repoSignals, scope = "watched", limit = 12) {
  const source = toArray(repoSignals);

  const filtered = source.filter((signal) => {
    if (scope === "mine") return signal.scope === "mine";
    if (scope === "research") return signal.scope === "research";
    if (scope === "starred") return signal.scope === "starred";
    if (scope === "watched") return signal.scope === "research" || signal.scope === "mine" || signal.adoptionScore >= 55;
    return true;
  });

  return filtered.slice(0, limit);
}

export {
  MINE_HEALTH_FILE,
  REPO_SIGNALS_FILE,
  RESEARCH_QUEUE_FILE,
  SKILL_EXTRACTIONS_FILE,
};

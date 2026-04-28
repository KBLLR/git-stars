import fs from "fs/promises";
import path from "path";

const DATA_FILE = "data.json";
const MY_REPOS_FILE = "my-repos.json";
const RESEARCH_QUEUE_FILE = "research-queue.json";
const REPO_SIGNALS_FILE = "repo-signals.json";
const SKILL_EXTRACTIONS_FILE = "skill-extractions.json";
const MINE_HEALTH_FILE = "mine-health.json";
const ACTION_ITEMS_FILE = "action-items.json";
const REPO_INSPECTIONS_FILE = "repo-inspections.json";
const AUTOMATION_RUNS_FILE = "automation-runs.json";
const OPS_DIGEST_FILE = "ops-digest.json";
const WEEKLY_RESEARCH_REVIEW_FILE = "weekly-research-review.json";
const TEMPLATE_KITS_FILE = "template-kits.json";
const REPO_OPS_KITS_FILE = "repo-ops-kits.json";

const RESEARCH_STATUSES = new Set(["queued", "researching", "done", "dismissed"]);
const ADOPTION_KINDS = new Set(["house", "tool", "service", "template", "ignore"]);
const ACTION_STATUSES = new Set(["open", "reviewing", "accepted", "dismissed", "done"]);
const ACTION_KINDS = new Set(["readme", "maintenance", "deployment", "testing", "dependency", "research", "skill", "template", "adoption"]);
const MISSION_TARGETS = new Set(["codex", "claude", "mlx"]);

const TEMPLATE_KITS = [
  {
    id: "vega-lab:house-reference",
    label: "House Reference Templates",
    description: "Reusable Vega Lab house sources for README, AGENTS, SKILLS, RULES, and WORKFLOWS artifacts.",
    artifactKinds: ["readme", "agents", "skills", "rules", "workflows"],
    targets: ["codex", "claude", "mlx"],
    templatePaths: [
      "templates/house/README.md",
      "templates/house/AGENTS.md",
      "templates/house/SKILLS.md",
      "templates/house/RULES.md",
      "templates/house/WORKFLOWS.md",
      "templates/context/core-x-ecosystem.md",
      "templates/context/vega-lab-role.md",
      "templates/context/tech-stack-defaults.md",
      "templates/context/good-candidate-criteria.md",
      "templates/context/mlx-openresponses-policy.md",
    ],
  },
  {
    id: "vega-lab:repo-ops-kit",
    label: "Repo Ops Kit",
    description: "Draft-only repo readiness kit covering README, AGENTS, maintenance, deployment, testing, and inbox actions.",
    artifactKinds: ["readme", "agents", "maintenance", "deployment", "testing", "action-item"],
    targets: ["codex", "claude", "mlx"],
    templatePaths: [
      "templates/ops/README_DRAFT.md",
      "templates/ops/AGENTS_DRAFT.md",
      "templates/ops/MAINTENANCE_PLAN.md",
      "templates/ops/DEPLOYMENT_PLAN.md",
      "templates/ops/TEST_PLAN.md",
      "templates/ops/ACTION_ITEM.md",
      "templates/context/core-x-ecosystem.md",
      "templates/context/vega-lab-role.md",
      "templates/context/tech-stack-defaults.md",
      "templates/context/good-candidate-criteria.md",
      "templates/context/mlx-openresponses-policy.md",
    ],
  },
];

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

function actionId(kind, nwo) {
  return `vega-lab:${kind}:${nwoKey(nwo).replace(/[^a-z0-9]+/g, "-")}`;
}

function normalizeMissionTarget(target = "mlx") {
  const nextTarget = String(target || "mlx").trim().toLowerCase();
  if (!MISSION_TARGETS.has(nextTarget)) {
    throw new Error(`Unsupported mission target: ${target}. Supported targets: codex, claude, mlx.`);
  }
  return nextTarget;
}

function missionTargetLabel(target) {
  const normalizedTarget = normalizeMissionTarget(target);
  if (normalizedTarget === "claude") return "Claude";
  if (normalizedTarget === "mlx") return "Local MLX";
  return "Codex";
}

function snapshotTimestamp(repos, researchQueue = []) {
  const timestamps = [
    ...toArray(repos).map((repo) => repoUpdatedAt(repo).getTime()),
    ...toArray(researchQueue).map((item) => Date.parse(item.updatedAt || item.createdAt || "")),
  ].filter((value) => Number.isFinite(value) && value > 0);

  if (timestamps.length === 0) return new Date(0).toISOString();
  return new Date(Math.max(...timestamps)).toISOString();
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
  const normalizedTarget = normalizeMissionTarget(target);
  const label = missionTargetLabel(normalizedTarget);
  const steps = extraction.flows.map((flow, index) => `${index + 1}. ${flow}`).join("\n");
  const rules = extraction.rules.map((rule) => `- ${rule}`).join("\n");
  const skills = extraction.houseSkills.join(", ") || "none";
  const capabilities = extraction.capabilities.join(", ") || "none";
  const deliverable = normalizedTarget === "mlx"
    ? "produce a local MLX/OpenResponses-ready plan with concise, tool-grounded steps and explicit missing-data callouts."
    : `produce an actionable ${label.toLowerCase()}-ready plan grounded in the repo's capabilities and adoption fit.`;

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
    `Deliverable: ${deliverable}`,
  ].join("\n");
}

export function buildMissionBriefForTarget(extraction, target) {
  return buildMissionBrief(extraction, target);
}

function buildSummary(repo, adoptionKind, houseSkills, capabilities) {
  const firstSkill = houseSkills[0] || "repo-discovery";
  const firstCapability = capabilities[0] || "general engineering";
  const description = repo.description && repo.description !== "No description"
    ? repo.description
    : `${repo.name} is a candidate for ${adoptionKind} adoption.`;

  return `${description} Primary Vega Lab fit: ${firstSkill} via ${firstCapability}.`;
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
  const recommendedActions = ["mlx-mission", "ops-kit", "codex-mission", "claude-mission"];

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

function getRepoKeyFiles(repo) {
  return repo.key_files && typeof repo.key_files === "object" ? repo.key_files : {};
}

function packageScripts(repo) {
  const packageJson = getRepoKeyFiles(repo).packageJson;
  return packageJson && typeof packageJson === "object" && packageJson.scripts
    ? packageJson.scripts
    : {};
}

function inferPackageManagers(repo) {
  const keyFiles = getRepoKeyFiles(repo);
  const managers = toArray(keyFiles.packageManagers);
  if (managers.length > 0) return unique(managers);

  const language = repo.primary_language || repo.language || "";
  if (["JavaScript", "TypeScript", "Vue", "Svelte", "Astro"].includes(language)) {
    return ["npm"];
  }
  if (language === "Python") return ["pip"];
  if (language === "Rust") return ["cargo"];
  if (language === "Swift") return ["swiftpm"];
  return [];
}

function buildRepoInspection(repo, extraction) {
  const keyFiles = getRepoKeyFiles(repo);
  const scripts = packageScripts(repo);
  const scriptEntries = Object.entries(scripts);
  const testScripts = scriptEntries
    .filter(([name]) => /test|check|lint/i.test(name))
    .map(([name]) => name);
  const buildScripts = scriptEntries
    .filter(([name]) => /build|compile|bundle/i.test(name))
    .map(([name]) => name);
  const packageManagers = inferPackageManagers(repo);
  const workflows = toArray(keyFiles.workflows);
  const deploymentConfigs = toArray(keyFiles.deploymentConfigs);
  const findings = [];
  const risks = [];
  const isAppLike = extraction.adoptionKind === "house" || extraction.capabilities.some((capability) => ["frontend-ui", "backend-service"].includes(capability));
  const isPackageLike = packageManagers.length > 0;

  if (repo.has_readme === false) {
    findings.push("README missing from the synced repository snapshot.");
    risks.push("New contributors and agents lack a clear entrypoint.");
  } else if (repo.has_readme === null || repo.has_readme === undefined) {
    findings.push("README status is unknown.");
  }

  if (isPackageLike && testScripts.length === 0) {
    findings.push("No test/check/lint script detected from package metadata.");
    risks.push("Maintenance work has no obvious verification command.");
  }

  if (isPackageLike && buildScripts.length === 0 && isAppLike) {
    findings.push("No build script detected from package metadata.");
  }

  if (isAppLike && workflows.length === 0 && deploymentConfigs.length === 0) {
    findings.push("No workflow or deployment config detected in synced key files.");
    risks.push("Deployment readiness is unclear.");
  }

  if (computeStaleness(repo) === "stale") {
    findings.push("Repository appears stale based on last activity.");
    risks.push("Dependencies, build targets, or deployment assumptions may be outdated.");
  }

  if (extraction.adoptionKind === "template") {
    findings.push("Repository has template/scaffold signals.");
  }

  return {
    nwo: repoNwo(repo),
    inspectedAt: repoUpdatedAt(repo).toISOString(),
    files: {
      hasReadme: repo.has_readme ?? null,
      packageManagers,
      workflows,
      deploymentConfigs,
      testScripts,
      buildScripts,
    },
    findings: unique(findings),
    risks: unique(risks),
  };
}

function buildActionDraft(kind, repo, extraction, inspection) {
  const nwo = repoNwo(repo);
  const rules = extraction.rules.length > 0 ? extraction.rules.join(" ") : "Keep scope narrow and evidence-based.";
  const evidence = inspection.findings.slice(0, 3).join(" ");

  switch (kind) {
    case "readme":
      return `Draft a README readiness pass for ${nwo}: document purpose, local setup, primary commands, data/runtime assumptions, and a short maintenance section. Evidence: ${evidence}`;
    case "maintenance":
      return `Draft a maintenance plan for ${nwo}: verify dependencies, run available checks, update stale assumptions, and identify a smallest useful PR. Rules: ${rules}`;
    case "deployment":
      return `Draft a deployment readiness brief for ${nwo}: identify expected host, build command, env vars, workflow status, and verification URL checks. Evidence: ${evidence}`;
    case "testing":
      return `Draft a verification plan for ${nwo}: add or document lint/test/build commands and define the smallest smoke test agents should run before edits.`;
    case "skill":
      return `Extract a reusable Vega Lab skill/rule/flow package from ${nwo}, grounded in capabilities: ${extraction.capabilities.join(", ") || "general engineering"}.`;
    case "template":
      return `Draft a template extraction plan for ${nwo}: isolate reusable scaffold decisions, required configuration, and what must be removed before reuse.`;
    case "research":
      return `Write a research brief for ${nwo}: why it matters, what core-x can learn, adoption fit, and next action.`;
    case "adoption":
      return `Draft an adoption decision for ${nwo}: classify as ${extraction.adoptionKind}, justify the score, list risks, and define integration boundaries.`;
    default:
      return `Draft the next Vega Lab action for ${nwo}.`;
  }
}

function actionBase({ kind, priority, repo, extraction, inspection, title, summary, source = "daily-ops" }) {
  const nwo = repoNwo(repo);
  const updatedAt = inspection.inspectedAt;
  return {
    id: actionId(kind, nwo),
    kind,
    status: "open",
    priority,
    nwo,
    title,
    summary,
    evidence: unique([...inspection.findings, ...inspection.risks]).slice(0, 5),
    linkedSkills: extraction.houseSkills,
    linkedRules: extraction.rules,
    linkedFlows: extraction.flows,
    draft: buildActionDraft(kind, repo, extraction, inspection),
    source,
    createdAt: updatedAt,
    updatedAt,
  };
}

function mergeActionItem(generated, existingMap) {
  const existing = existingMap.get(generated.id);
  if (!existing) return generated;

  return {
    ...generated,
    status: ACTION_STATUSES.has(existing.status) ? existing.status : generated.status,
    createdAt: existing.createdAt || generated.createdAt,
    updatedAt: existing.updatedAt || generated.updatedAt,
    draft: existing.draft || generated.draft,
  };
}

function buildActionItems({ repos, repoSignals, skillExtractions, mineHealth, repoInspections, existingActionItems }) {
  const repoMap = new Map(toArray(repos).map((repo) => [nwoKey(repoNwo(repo)), repo]));
  const extractionMap = new Map(toArray(skillExtractions).map((item) => [nwoKey(item.nwo), item]));
  const inspectionMap = new Map(toArray(repoInspections).map((item) => [nwoKey(item.nwo), item]));
  const existingMap = new Map(toArray(existingActionItems).map((item) => [item.id, item]));
  const generated = [];

  for (const health of toArray(mineHealth)) {
    const repo = repoMap.get(nwoKey(health.nwo));
    const extraction = extractionMap.get(nwoKey(health.nwo));
    const inspection = inspectionMap.get(nwoKey(health.nwo));
    if (!repo || !extraction || !inspection) continue;

    if (health.healthFlags.includes("missing-readme")) {
      generated.push(actionBase({
        kind: "readme",
        priority: "high",
        repo,
        extraction,
        inspection,
        title: `Make ${repo.name} README-ready`,
        summary: "The repo needs a clear human and agent entrypoint before broader ecosystem use.",
      }));
    }

    if (health.healthFlags.includes("stale")) {
      generated.push(actionBase({
        kind: "maintenance",
        priority: "normal",
        repo,
        extraction,
        inspection,
        title: `Run a maintenance pass on ${repo.name}`,
        summary: "Stale activity increases dependency, workflow, and deployment risk.",
      }));
    }

    if (inspection.files.packageManagers.length > 0 && inspection.files.testScripts.length === 0) {
      generated.push(actionBase({
        kind: "testing",
        priority: "normal",
        repo,
        extraction,
        inspection,
        title: `Define verification for ${repo.name}`,
        summary: "Package metadata does not expose an obvious test, check, or lint command.",
      }));
    }

    if (inspection.risks.some((risk) => risk.includes("Deployment"))) {
      generated.push(actionBase({
        kind: "deployment",
        priority: "normal",
        repo,
        extraction,
        inspection,
        title: `Clarify deployment readiness for ${repo.name}`,
        summary: "Vega Lab could not detect workflow or deployment configuration from synced key files.",
      }));
    }

    if (health.healthFlags.includes("template-candidate")) {
      generated.push(actionBase({
        kind: "template",
        priority: "normal",
        repo,
        extraction,
        inspection,
        title: `Evaluate ${repo.name} as a reusable template`,
        summary: "The repo has scaffold signals that may become a reusable core-x pattern.",
        source: "weekly-research",
      }));
    }
  }

  for (const signal of toArray(repoSignals).slice(0, 50)) {
    const repo = repoMap.get(nwoKey(signal.nwo));
    const extraction = extractionMap.get(nwoKey(signal.nwo));
    const inspection = inspectionMap.get(nwoKey(signal.nwo)) ?? {
      nwo: signal.nwo,
      inspectedAt: signal.lastActivityAt,
      files: { hasReadme: null, packageManagers: [], workflows: [], deploymentConfigs: [], testScripts: [], buildScripts: [] },
      findings: signal.reasons,
      risks: [],
    };
    if (!repo || !extraction) continue;

    if (signal.adoptionScore >= 80 && signal.adoptionKind !== "ignore") {
      generated.push(actionBase({
        kind: "adoption",
        priority: "high",
        repo,
        extraction,
        inspection,
        title: `Decide adoption path for ${repo.name}`,
        summary: `${signal.adoptionKind} candidate with score ${signal.adoptionScore}.`,
        source: "weekly-research",
      }));
    }

    if (signal.houseSkills.includes("skill-extraction") && signal.adoptionScore >= 65) {
      generated.push(actionBase({
        kind: "skill",
        priority: "normal",
        repo,
        extraction,
        inspection,
        title: `Extract reusable skill signals from ${repo.name}`,
        summary: "The repo maps to tooling, agents, templates, or workflows that can teach core-x.",
        source: "weekly-research",
      }));
    }
  }

  const byId = new Map();
  for (const item of generated) {
    if (!byId.has(item.id)) {
      byId.set(item.id, mergeActionItem(item, existingMap));
    }
  }
  for (const item of toArray(existingActionItems)) {
    if (item?.id && !byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  return [...byId.values()].sort((a, b) => {
    const priority = { critical: 0, high: 1, normal: 2, low: 3 };
    if (priority[a.priority] !== priority[b.priority]) return priority[a.priority] - priority[b.priority];
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

function buildOpsDigest({ timestamp, actionItems, myRepos, researchQueue }) {
  const openItems = toArray(actionItems).filter((item) => item.status === "open" || item.status === "reviewing");
  const criticalItems = openItems.filter((item) => item.priority === "critical" || item.priority === "high");
  const highlights = openItems.slice(0, 6).map((item) => `${item.title}: ${item.summary}`);

  return {
    generatedAt: timestamp,
    summary: `${openItems.length} open Vega Lab actions across ${toArray(myRepos).length} owned repositories.`,
    counts: {
      openActions: openItems.length,
      criticalActions: criticalItems.length,
      ownedRepos: toArray(myRepos).length,
      researchQueue: toArray(researchQueue).length,
    },
    highlights,
    recommendedActions: openItems.slice(0, 8).map((item) => ({
      id: item.id,
      nwo: item.nwo,
      title: item.title,
      priority: item.priority,
      kind: item.kind,
    })),
    actionItemIds: openItems.slice(0, 12).map((item) => item.id),
  };
}

function buildWeeklyResearchReview({ timestamp, actionItems, repoSignals }) {
  const adoptionCandidates = toArray(repoSignals)
    .filter((signal) => signal.adoptionKind !== "ignore")
    .slice(0, 8)
    .map((signal) => signal.nwo);
  const skillCandidates = toArray(repoSignals)
    .filter((signal) => signal.houseSkills.includes("skill-extraction"))
    .slice(0, 8)
    .map((signal) => signal.nwo);
  const researchCandidates = toArray(repoSignals)
    .filter((signal) => signal.scope === "research" || signal.capabilities.includes("research-intelligence"))
    .slice(0, 8)
    .map((signal) => signal.nwo);

  return {
    generatedAt: timestamp,
    summary: "Weekly Vega Lab review for bright-star adoption, skill extraction, and research queue movement.",
    brightStars: adoptionCandidates,
    adoptionCandidates,
    skillCandidates,
    researchCandidates,
    actionItemIds: toArray(actionItems)
      .filter((item) => item.source === "weekly-research")
      .slice(0, 12)
      .map((item) => item.id),
  };
}

function buildAutomationRuns({ timestamp, actionItems }) {
  return [
    {
      id: "vega-lab:daily-ops:last",
      kind: "daily-ops",
      startedAt: timestamp,
      completedAt: timestamp,
      status: "success",
      createdActionItemIds: toArray(actionItems).filter((item) => item.source === "daily-ops").map((item) => item.id),
      notes: ["Generated draft-only owned-repo action items and ops digest."],
    },
    {
      id: "vega-lab:weekly-research:last",
      kind: "weekly-research",
      startedAt: timestamp,
      completedAt: timestamp,
      status: "success",
      createdActionItemIds: toArray(actionItems).filter((item) => item.source === "weekly-research").map((item) => item.id),
      notes: ["Generated draft-only adoption, research, and skill extraction recommendations."],
    },
  ];
}

function buildTemplateKits() {
  return TEMPLATE_KITS.map((kit) => ({
    ...kit,
    artifactKinds: [...kit.artifactKinds],
    targets: [...kit.targets],
    templatePaths: [...kit.templatePaths],
  }));
}

function listText(items, fallback = "None detected.") {
  const values = toArray(items).filter(Boolean);
  if (values.length === 0) return `- ${fallback}`;
  return values.map((item) => `- ${item}`).join("\n");
}

function inlineList(items, fallback = "none") {
  const values = toArray(items).filter(Boolean);
  return values.length > 0 ? values.join(", ") : fallback;
}

function scriptCommands(scriptNames) {
  return toArray(scriptNames).map((scriptName) => `npm run ${scriptName}`);
}

function buildOpsKitEvidence({ repo, extraction, inspection, health, actionItems }) {
  return unique([
    `Repository: ${repoNwo(repo)}`,
    repo.description && repo.description !== "No description" ? `Description: ${repo.description}` : null,
    `Adoption kind: ${extraction.adoptionKind}`,
    `Capabilities: ${inlineList(extraction.capabilities)}`,
    `House skills: ${inlineList(extraction.houseSkills)}`,
    ...toArray(inspection?.findings).map((finding) => `Finding: ${finding}`),
    ...toArray(inspection?.risks).map((risk) => `Risk: ${risk}`),
    ...toArray(health?.healthFlags).map((flag) => `Health flag: ${flag}`),
    ...toArray(actionItems).slice(0, 4).map((item) => `Action item: ${item.title}`),
  ]).slice(0, 12);
}

function buildRepoOpsKitArtifacts({ repo, extraction, inspection, health, actionItems, target, evidence }) {
  const nwo = repoNwo(repo);
  const targetLabel = missionTargetLabel(target);
  const packageManagers = inspection?.files?.packageManagers ?? [];
  const workflows = inspection?.files?.workflows ?? [];
  const deploymentConfigs = inspection?.files?.deploymentConfigs ?? [];
  const testCommands = scriptCommands(inspection?.files?.testScripts ?? []);
  const buildCommands = scriptCommands(inspection?.files?.buildScripts ?? []);
  const verificationCommands = unique([...testCommands, ...buildCommands]);
  const healthFlags = health?.healthFlags ?? [];
  const recommendedActions = health?.recommendedActions ?? [];
  const rules = extraction.rules.length > 0 ? extraction.rules : ["Keep scope narrow and evidence-based."];
  const linkedActions = toArray(actionItems).map((item) => `${item.kind}: ${item.title}`);

  return [
    {
      kind: "readme",
      title: `${repo.name} README Draft`,
      suggestedPath: "README.md",
      body: [
        `# ${repo.name}`,
        "",
        repo.description && repo.description !== "No description"
          ? repo.description
          : `${repo.name} needs a concise purpose statement before broader core-x adoption.`,
        "",
        "## Vega Lab Fit",
        `- Classification: ${extraction.adoptionKind}`,
        `- Capabilities: ${inlineList(extraction.capabilities)}`,
        `- House skills: ${inlineList(extraction.houseSkills)}`,
        "",
        "## Local Setup",
        `- Package managers: ${inlineList(packageManagers)}`,
        "- Document install, dev, build, and verification commands before broad reuse.",
        "- Keep runtime assumptions explicit; prefer local MLX/OpenResponses for model-assisted work.",
        "",
        "## Verification",
        listText(verificationCommands, "Define a lint/test/build command before code edits."),
        "",
        "## Evidence",
        listText(evidence.slice(0, 6)),
      ].join("\n"),
      evidence: evidence.slice(0, 6),
    },
    {
      kind: "agents",
      title: `${repo.name} AGENTS Draft`,
      suggestedPath: "AGENTS.md",
      body: [
        `# ${repo.name} Agents`,
        "",
        "## Product Truth",
        `- Repository: ${nwo}`,
        `- Vega Lab classification: ${extraction.adoptionKind}`,
        `- Active mission target: ${targetLabel}`,
        "",
        "## Operating Rules",
        listText(rules),
        "",
        "## Commands",
        listText(verificationCommands, "Add the smallest reliable verification command."),
        "",
        "## Agent Boundaries",
        "- Do not mutate deployment, secrets, or release configuration without explicit approval.",
        "- Prefer draft plans and reviewable diffs over broad automation.",
        "- Preserve existing product direction; use Vega Lab evidence before adding new abstractions.",
      ].join("\n"),
      evidence: evidence.slice(0, 6),
    },
    {
      kind: "maintenance",
      title: `${repo.name} Maintenance Plan`,
      suggestedPath: "docs/maintenance-plan.md",
      body: [
        `# Maintenance Plan: ${nwo}`,
        "",
        "## Current Signals",
        listText([
          ...healthFlags.map((flag) => `Health flag: ${flag}`),
          ...toArray(inspection?.findings),
        ], "No maintenance flags detected."),
        "",
        "## Recommended Pass",
        listText([
          "Confirm install path and package manager.",
          "Run available verification commands before editing.",
          "Patch stale docs, commands, and workflow assumptions first.",
          "Open the smallest useful PR only after human approval.",
          ...recommendedActions.map((action) => `Vega Lab action: ${action}`),
        ]),
        "",
        "## Evidence",
        listText(evidence.slice(0, 8)),
      ].join("\n"),
      evidence: evidence.slice(0, 8),
    },
    {
      kind: "deployment",
      title: `${repo.name} Deployment Plan`,
      suggestedPath: "docs/deployment-plan.md",
      body: [
        `# Deployment Plan: ${nwo}`,
        "",
        "## Known Deployment Evidence",
        listText([
          ...workflows.map((workflow) => `Workflow: ${workflow}`),
          ...deploymentConfigs.map((config) => `Deployment config: ${config}`),
        ], "No workflow or deployment config detected in synced key files."),
        "",
        "## Draft Checks",
        listText([
          "Identify expected host and runtime.",
          "Document build command, output directory, and required environment variables.",
          "Verify preview URL and production URL checks.",
          "Keep deploy authority manual; Vega Lab drafts plans and inbox items only.",
        ]),
        "",
        "## Evidence",
        listText(evidence.slice(0, 8)),
      ].join("\n"),
      evidence: evidence.slice(0, 8),
    },
    {
      kind: "testing",
      title: `${repo.name} Test Plan`,
      suggestedPath: "docs/test-plan.md",
      body: [
        `# Test Plan: ${nwo}`,
        "",
        "## Available Commands",
        listText(verificationCommands, "No test/check/build script detected from synced package metadata."),
        "",
        "## Minimum Verification Contract",
        listText([
          "Document one install command.",
          "Document one fast smoke command.",
          "Document one release/build command when deployable.",
          "If no commands exist, create a tracked issue or action item before implementation work.",
        ]),
        "",
        "## Evidence",
        listText(evidence.slice(0, 8)),
      ].join("\n"),
      evidence: evidence.slice(0, 8),
    },
    {
      kind: "action-item",
      title: `${repo.name} Action Item Draft`,
      suggestedPath: "ops/action-item.md",
      body: [
        `# Action Item Draft: ${nwo}`,
        "",
        "## Recommended Actions",
        listText(linkedActions.length > 0 ? linkedActions : recommendedActions, "No existing inbox item; draft README, maintenance, or adoption review based on the evidence."),
        "",
        "## Mission Target",
        `- ${targetLabel}`,
        "",
        "## Evidence",
        listText(evidence.slice(0, 10)),
      ].join("\n"),
      evidence: evidence.slice(0, 10),
    },
  ];
}

function buildRepoOpsKit({ repo, extraction, inspection, health, actionItems = [], target = "mlx" }) {
  const normalizedTarget = normalizeMissionTarget(target);
  const evidence = buildOpsKitEvidence({ repo, extraction, inspection, health, actionItems });
  const artifacts = buildRepoOpsKitArtifacts({
    repo,
    extraction,
    inspection,
    health,
    actionItems,
    target: normalizedTarget,
    evidence,
  });

  return {
    nwo: repoNwo(repo),
    generatedAt: inspection?.inspectedAt || repoUpdatedAt(repo).toISOString(),
    target: normalizedTarget,
    artifacts,
    evidence,
    recommendedActions: unique([
      ...toArray(health?.recommendedActions),
      ...toArray(actionItems).map((item) => `${item.kind}:${item.id}`),
      "review-draft-only",
    ]),
  };
}

function repoOpsKitKey(kit) {
  const rawTarget = String(kit.target || "mlx").trim().toLowerCase();
  const target = MISSION_TARGETS.has(rawTarget) ? rawTarget : "mlx";
  return `${nwoKey(kit.nwo)}:${target}`;
}

function buildRepoOpsKits({ repos, skillExtractions, mineHealth, repoInspections, actionItems, existingRepoOpsKits }) {
  const repoMap = new Map(toArray(repos).map((repo) => [nwoKey(repoNwo(repo)), repo]));
  const extractionMap = new Map(toArray(skillExtractions).map((item) => [nwoKey(item.nwo), item]));
  const inspectionMap = new Map(toArray(repoInspections).map((item) => [nwoKey(item.nwo), item]));
  const healthMap = new Map(toArray(mineHealth).map((item) => [nwoKey(item.nwo), item]));
  const kits = new Map();

  for (const health of toArray(mineHealth)) {
    const repo = repoMap.get(nwoKey(health.nwo));
    const extraction = extractionMap.get(nwoKey(health.nwo));
    if (!repo || !extraction) continue;
    const relatedActions = toArray(actionItems).filter((item) => nwoKey(item.nwo) === nwoKey(health.nwo));
    const kit = buildRepoOpsKit({
      repo,
      extraction,
      inspection: inspectionMap.get(nwoKey(health.nwo)),
      health,
      actionItems: relatedActions,
      target: "mlx",
    });
    kits.set(repoOpsKitKey(kit), kit);
  }

  for (const existing of toArray(existingRepoOpsKits)) {
    if (!existing?.nwo) continue;
    const key = repoOpsKitKey(existing);
    if (!kits.has(key)) {
      kits.set(key, existing);
    }
  }

  return [...kits.values()].sort((a, b) => {
    const nwoCompare = a.nwo.localeCompare(b.nwo);
    return nwoCompare !== 0 ? nwoCompare : a.target.localeCompare(b.target);
  });
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
  const actionItems = await readJson(path.join(dataDir, ACTION_ITEMS_FILE), null)
    ?? await readJson(path.join(publicDir, ACTION_ITEMS_FILE), []);
  const repoOpsKits = await readJson(path.join(dataDir, REPO_OPS_KITS_FILE), null)
    ?? await readJson(path.join(publicDir, REPO_OPS_KITS_FILE), []);

  return {
    starredRepos: Array.isArray(starredRepos) ? starredRepos : [],
    myRepos: Array.isArray(myRepos) ? myRepos : [],
    researchQueue: Array.isArray(researchQueue) ? researchQueue : [],
    actionItems: Array.isArray(actionItems) ? actionItems : [],
    repoOpsKits: Array.isArray(repoOpsKits) ? repoOpsKits : [],
  };
}

export function buildDerivedHouseData({ starredRepos, myRepos, researchQueue, actionItems = [], repoOpsKits = [] }) {
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
  const repoInspections = [];

  for (const repo of repoMap.values()) {
    const key = nwoKey(repoNwo(repo));
    const extraction = buildSkillExtraction(repo, queueMap.get(key), mineKeys.has(key));
    skillExtractions.push(extraction);
    repoSignals.push(buildRepoSignal(repo, extraction, queueMap.get(key), mineKeys.has(key)));

    if (mineKeys.has(key)) {
      mineHealth.push(buildMineHealth(repo, extraction));
      repoInspections.push(buildRepoInspection(repo, extraction));
    }
  }

  const sortedSignals = repoSignals.sort(compareSignals);
  const sortedExtractions = skillExtractions.sort((a, b) => a.nwo.localeCompare(b.nwo));
  const sortedMineHealth = mineHealth.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const sortedInspections = repoInspections.sort((a, b) => a.nwo.localeCompare(b.nwo));
  const generatedActionItems = buildActionItems({
    repos: [...repoMap.values()],
    repoSignals: sortedSignals,
    skillExtractions: sortedExtractions,
    mineHealth: sortedMineHealth,
    repoInspections: sortedInspections,
    existingActionItems: actionItems,
  });
  const timestamp = snapshotTimestamp([...repoMap.values()], normalizedQueue);
  const opsDigest = buildOpsDigest({
    timestamp,
    actionItems: generatedActionItems,
    myRepos,
    researchQueue: normalizedQueue,
  });
  const weeklyResearchReview = buildWeeklyResearchReview({
    timestamp,
    actionItems: generatedActionItems,
    repoSignals: sortedSignals,
  });
  const generatedRepoOpsKits = buildRepoOpsKits({
    repos: [...repoMap.values()],
    skillExtractions: sortedExtractions,
    mineHealth: sortedMineHealth,
    repoInspections: sortedInspections,
    actionItems: generatedActionItems,
    existingRepoOpsKits: repoOpsKits,
  });

  return {
    researchQueue: normalizedQueue.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    repoSignals: sortedSignals,
    skillExtractions: sortedExtractions,
    mineHealth: sortedMineHealth,
    repoInspections: sortedInspections,
    actionItems: generatedActionItems,
    opsDigest,
    weeklyResearchReview,
    automationRuns: buildAutomationRuns({ timestamp, actionItems: generatedActionItems }),
    templateKits: buildTemplateKits(),
    repoOpsKits: generatedRepoOpsKits,
  };
}

export async function writeDerivedHouseData(rootDir, payload) {
  const { dataDir, publicDir } = resolveDataPaths(rootDir);
  const outputs = [
    [RESEARCH_QUEUE_FILE, payload.researchQueue],
    [REPO_SIGNALS_FILE, payload.repoSignals],
    [SKILL_EXTRACTIONS_FILE, payload.skillExtractions],
    [MINE_HEALTH_FILE, payload.mineHealth],
    [REPO_INSPECTIONS_FILE, payload.repoInspections],
    [ACTION_ITEMS_FILE, payload.actionItems],
    [OPS_DIGEST_FILE, payload.opsDigest],
    [WEEKLY_RESEARCH_REVIEW_FILE, payload.weeklyResearchReview],
    [AUTOMATION_RUNS_FILE, payload.automationRuns],
    [TEMPLATE_KITS_FILE, payload.templateKits],
    [REPO_OPS_KITS_FILE, payload.repoOpsKits],
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
    actionItems: overrides.actionItems ?? datasets.actionItems,
    repoOpsKits: overrides.repoOpsKits ?? datasets.repoOpsKits,
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
    actionItems: datasets.actionItems,
  });

  return payload.researchQueue.find((item) => nwoKey(item.nwo) === key) ?? null;
}

export async function updateActionItem(rootDir, { id, status, notes = "" }) {
  const datasets = await loadHouseDatasets(rootDir);
  const current = buildDerivedHouseData(datasets).actionItems;
  const index = current.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const timestamp = new Date().toISOString();
  current[index] = {
    ...current[index],
    status: ACTION_STATUSES.has(status) ? status : current[index].status,
    draft: notes ? `${current[index].draft}\n\nReview notes: ${notes}` : current[index].draft,
    updatedAt: timestamp,
  };

  const payload = await generateDerivedHouseData(rootDir, {
    starredRepos: datasets.starredRepos,
    myRepos: datasets.myRepos,
    researchQueue: datasets.researchQueue,
    actionItems: current,
  });

  return payload.actionItems.find((item) => item.id === id) ?? null;
}

export async function draftActionItem(rootDir, { kind, name, author, source = "manual" }) {
  const datasets = await loadHouseDatasets(rootDir);
  const payload = buildDerivedHouseData(datasets);
  const repo = resolveRepoRecord({ name, author }, datasets);
  if (!repo) return null;

  const nwo = repoNwo(repo);
  const extraction = findSkillExtraction(payload.skillExtractions, nwo);
  if (!extraction) return null;

  const inspection = findRepoInspection(payload.repoInspections, nwo) ?? {
    nwo,
    inspectedAt: repoUpdatedAt(repo).toISOString(),
    files: { hasReadme: repo.has_readme ?? null, packageManagers: [], workflows: [], deploymentConfigs: [], testScripts: [], buildScripts: [] },
    findings: [],
    risks: [],
  };
  const nextKind = ACTION_KINDS.has(kind) ? kind : "research";
  const manualItem = actionBase({
    kind: nextKind,
    priority: "normal",
    repo,
    extraction,
    inspection,
    title: `Draft ${nextKind} action for ${repo.name}`,
    summary: "Manual Vega Lab draft action created from the current repository context.",
    source,
  });
  const existing = payload.actionItems.filter((item) => item.id !== manualItem.id);
  const regenerated = await generateDerivedHouseData(rootDir, {
    starredRepos: datasets.starredRepos,
    myRepos: datasets.myRepos,
    researchQueue: datasets.researchQueue,
    actionItems: [manualItem, ...existing],
  });

  return regenerated.actionItems.find((item) => item.id === manualItem.id) ?? manualItem;
}

export function listTemplateKits() {
  return buildTemplateKits();
}

export async function generateRepoOpsKit(rootDir, { name, author, target = "mlx" }) {
  const normalizedTarget = normalizeMissionTarget(target);
  const datasets = await loadHouseDatasets(rootDir);
  const payload = buildDerivedHouseData(datasets);
  const repo = resolveRepoRecord({ name, author }, datasets);
  if (!repo) return null;

  const nwo = repoNwo(repo);
  const extraction = findSkillExtraction(payload.skillExtractions, nwo);
  if (!extraction) return null;

  const inspection = findRepoInspection(payload.repoInspections, nwo)
    ?? buildRepoInspection(repo, extraction);
  const health = findMineHealthRecord(payload.mineHealth, nwo)
    ?? buildMineHealth(repo, extraction);
  const relatedActions = toArray(payload.actionItems).filter((item) => nwoKey(item.nwo) === nwoKey(nwo));
  const kit = buildRepoOpsKit({
    repo,
    extraction,
    inspection,
    health,
    actionItems: relatedActions,
    target: normalizedTarget,
  });

  const nextKits = new Map(toArray(payload.repoOpsKits).map((item) => [repoOpsKitKey(item), item]));
  nextKits.set(repoOpsKitKey(kit), kit);
  const repoOpsKits = [...nextKits.values()].sort((a, b) => {
    const nwoCompare = a.nwo.localeCompare(b.nwo);
    return nwoCompare !== 0 ? nwoCompare : a.target.localeCompare(b.target);
  });

  await writeDerivedHouseData(rootDir, {
    ...payload,
    repoOpsKits,
    templateKits: buildTemplateKits(),
  });

  return kit;
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

export function findRepoInspection(repoInspections, nwo) {
  return toArray(repoInspections).find((item) => nwoKey(item.nwo) === nwoKey(nwo)) ?? null;
}

export function findMineHealthRecord(mineHealth, nwo) {
  return toArray(mineHealth).find((item) => nwoKey(item.nwo) === nwoKey(nwo)) ?? null;
}

export function listActionItems(actionItems, filters = {}) {
  return toArray(actionItems)
    .filter((item) => !filters.status || item.status === filters.status)
    .filter((item) => !filters.kind || item.kind === filters.kind)
    .filter((item) => !filters.priority || item.priority === filters.priority)
    .slice(0, filters.limit ?? 50);
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
  ACTION_ITEMS_FILE,
  AUTOMATION_RUNS_FILE,
  MINE_HEALTH_FILE,
  OPS_DIGEST_FILE,
  REPO_OPS_KITS_FILE,
  REPO_INSPECTIONS_FILE,
  REPO_SIGNALS_FILE,
  RESEARCH_QUEUE_FILE,
  SKILL_EXTRACTIONS_FILE,
  TEMPLATE_KITS_FILE,
  WEEKLY_RESEARCH_REVIEW_FILE,
};

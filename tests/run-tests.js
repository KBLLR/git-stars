import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import assert from "node:assert/strict";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function readJson(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  assert.ok(fs.existsSync(absolutePath), `Expected file to exist: ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
}

function ensureDataMirror(relativePath) {
  const dataPath = path.join(projectRoot, "data", relativePath);
  const publicPath = path.join(projectRoot, "public", relativePath);
  assert.ok(fs.existsSync(publicPath), `Expected file to exist: public/${relativePath}`);

  if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  }

  if (!fs.existsSync(dataPath)) {
    fs.copyFileSync(publicPath, dataPath);
  }

  return {
    dataCopy: JSON.parse(fs.readFileSync(dataPath, "utf-8")),
    publicCopy: JSON.parse(fs.readFileSync(publicPath, "utf-8")),
  };
}

function assertMirroredJson(relativePath) {
  const { dataCopy, publicCopy } = ensureDataMirror(relativePath);
  assert.deepEqual(publicCopy, dataCopy, `Expected public/${relativePath} to mirror data/${relativePath}`);
  return dataCopy;
}

const repositories = assertMirroredJson("data.json");
const myRepos = assertMirroredJson("my-repos.json");
const stats = assertMirroredJson("stats.json");

assert.ok(Array.isArray(repositories), "data.json must be an array");
assert.ok(repositories.length > 0, "Repository list should not be empty");
assert.ok(Array.isArray(myRepos), "my-repos.json must be an array");
assert.ok(stats && typeof stats === "object", "stats.json should contain aggregate statistics");

const firstRepo = repositories[0];
assert.equal(typeof firstRepo.name, "string", "Each repository should have a name");
assert.equal(typeof firstRepo.author, "string", "Each repository should have an author");

const partialName = firstRepo.name.slice(0, Math.min(3, firstRepo.name.length)).toLowerCase();
const filteredByName = repositories.filter((repo) =>
  repo.name?.toLowerCase().includes(partialName)
  || repo.description?.toLowerCase().includes(partialName),
);
assert.ok(filteredByName.length > 0, "Filtering by partial name should return results");

const repoSignals = assertMirroredJson("repo-signals.json");
const researchQueue = assertMirroredJson("research-queue.json");
const skillExtractions = assertMirroredJson("skill-extractions.json");
const mineHealth = assertMirroredJson("mine-health.json");
const repoInspections = assertMirroredJson("repo-inspections.json");
const actionItems = assertMirroredJson("action-items.json");
const automationRuns = assertMirroredJson("automation-runs.json");
const opsDigest = assertMirroredJson("ops-digest.json");
const weeklyResearchReview = assertMirroredJson("weekly-research-review.json");

assert.ok(Array.isArray(repoSignals) && repoSignals.length > 0, "repo-signals.json should contain ranked signals");
assert.ok(Array.isArray(researchQueue), "research-queue.json should contain an array");
assert.ok(Array.isArray(skillExtractions) && skillExtractions.length > 0, "skill-extractions.json should contain canonical extractions");
assert.ok(Array.isArray(mineHealth) && mineHealth.length > 0, "mine-health.json should contain owned-repo health records");
assert.ok(Array.isArray(repoInspections) && repoInspections.length > 0, "repo-inspections.json should contain owned-repo inspections");
assert.ok(Array.isArray(actionItems), "action-items.json should contain durable inbox actions");
assert.ok(Array.isArray(automationRuns), "automation-runs.json should contain automation run records");
assert.equal(typeof opsDigest.summary, "string", "ops-digest.json should contain a summary");
assert.equal(typeof weeklyResearchReview.summary, "string", "weekly-research-review.json should contain a summary");

const firstSignal = repoSignals[0];
assert.equal(typeof firstSignal.nwo, "string", "RepoSignal.nwo should be present");
assert.ok(["starred", "mine", "research"].includes(firstSignal.scope), "RepoSignal.scope should be valid");
assert.ok(["active", "watch", "stale"].includes(firstSignal.staleness), "RepoSignal.staleness should be valid");
assert.ok(Array.isArray(firstSignal.reasons), "RepoSignal.reasons should be an array");
assert.ok(Array.isArray(firstSignal.houseSkills), "RepoSignal.houseSkills should be an array");

if (researchQueue.length > 0) {
  const queuedItem = researchQueue[0];
  assert.equal(typeof queuedItem.nwo, "string", "ResearchQueueItem.nwo should be present");
  assert.ok(["queued", "researching", "done", "dismissed"].includes(queuedItem.status), "ResearchQueueItem.status should be valid");
  assert.equal(typeof queuedItem.updatedAt, "string", "ResearchQueueItem.updatedAt should be present");
}

const firstExtraction = skillExtractions[0];
assert.equal(typeof firstExtraction.nwo, "string", "SkillExtraction.nwo should be present");
assert.ok(Array.isArray(firstExtraction.capabilities), "SkillExtraction.capabilities should be an array");
assert.ok(Array.isArray(firstExtraction.houseSkills), "SkillExtraction.houseSkills should be an array");
assert.ok(Array.isArray(firstExtraction.rules), "SkillExtraction.rules should be an array");
assert.ok(Array.isArray(firstExtraction.flows), "SkillExtraction.flows should be an array");
assert.equal(typeof firstExtraction.codexBrief, "string", "SkillExtraction.codexBrief should be present");
assert.equal(typeof firstExtraction.claudeBrief, "string", "SkillExtraction.claudeBrief should be present");

const firstMineRecord = mineHealth[0];
assert.equal(typeof firstMineRecord.nwo, "string", "MineHealthRecord.nwo should be present");
assert.ok(["public", "private"].includes(firstMineRecord.visibility), "MineHealthRecord.visibility should be valid");
assert.ok(Array.isArray(firstMineRecord.healthFlags), "MineHealthRecord.healthFlags should be an array");
assert.ok(Array.isArray(firstMineRecord.recommendedActions), "MineHealthRecord.recommendedActions should be an array");

const firstInspection = repoInspections[0];
assert.equal(typeof firstInspection.nwo, "string", "RepoInspection.nwo should be present");
assert.equal(typeof firstInspection.inspectedAt, "string", "RepoInspection.inspectedAt should be present");
assert.ok(firstInspection.files && typeof firstInspection.files === "object", "RepoInspection.files should be present");
assert.ok(Array.isArray(firstInspection.findings), "RepoInspection.findings should be an array");
assert.ok(Array.isArray(firstInspection.risks), "RepoInspection.risks should be an array");

if (actionItems.length > 0) {
  const ids = new Set(actionItems.map((item) => item.id));
  assert.equal(ids.size, actionItems.length, "Action items should be de-duplicated by id");
  const firstAction = actionItems[0];
  assert.ok(firstAction.id.startsWith("vega-lab:"), "ActionItem.id should use Vega Lab namespace");
  assert.ok(["open", "reviewing", "accepted", "dismissed", "done"].includes(firstAction.status), "ActionItem.status should be valid");
  assert.ok(Array.isArray(firstAction.evidence), "ActionItem.evidence should be an array");
  assert.ok(Array.isArray(firstAction.linkedSkills), "ActionItem.linkedSkills should be an array");
}

const runtimeRun = automationRuns.find((run) => run.id === "vega-lab:daily-ops:last");
assert.ok(runtimeRun, "Automation runs should include the daily ops record");

console.log("Derived data and mirroring checks passed.");

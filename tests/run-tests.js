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

function assertMirroredJson(relativePath) {
  const dataCopy = readJson(`data/${relativePath}`);
  const publicCopy = readJson(`public/${relativePath}`);
  assert.deepEqual(publicCopy, dataCopy, `Expected public/${relativePath} to mirror data/${relativePath}`);
  return dataCopy;
}

const dataCandidates = [
  path.join(projectRoot, "public", "data.json"),
  path.join(projectRoot, "data.json"),
];

const dataPath = dataCandidates.find((candidate) => fs.existsSync(candidate));
assert.ok(dataPath, "Could not find a data.json file to validate.");

const repositories = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
assert.ok(Array.isArray(repositories), "data.json must be an array");
assert.ok(repositories.length > 0, "Repository list should not be empty");

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

assert.ok(Array.isArray(repoSignals) && repoSignals.length > 0, "repo-signals.json should contain ranked signals");
assert.ok(Array.isArray(researchQueue), "research-queue.json should contain an array");
assert.ok(Array.isArray(skillExtractions) && skillExtractions.length > 0, "skill-extractions.json should contain canonical extractions");
assert.ok(Array.isArray(mineHealth) && mineHealth.length > 0, "mine-health.json should contain owned-repo health records");

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

console.log("Derived data and mirroring checks passed.");

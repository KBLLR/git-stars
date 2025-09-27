import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import assert from "node:assert/strict";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const dataCandidates = [
  path.join(projectRoot, "src", "frontend", "data.json"),
  path.join(projectRoot, "public", "data.json"),
  path.join(projectRoot, "data.json"),
];

const dataPath = dataCandidates.find((candidate) => fs.existsSync(candidate));
assert.ok(dataPath, "Could not find a data.json file to validate.");

const rawData = fs.readFileSync(dataPath, "utf-8");
const parsed = JSON.parse(rawData);
assert.ok(Array.isArray(parsed), "data.json must be an array");

const flattenRepos = (data) => {
  if (data.length === 0) return [];
  if (data[0] && Array.isArray(data[0].repos)) {
    return data.flatMap((group) => group.repos || []);
  }
  return data;
};

const repositories = flattenRepos(parsed);
assert.ok(repositories.length > 0, "Repository list should not be empty");

const filterRepos = (repos, { search = "", language = "all", tag = "all" } = {}) => {
  const lowerSearch = search.toLowerCase();
  return repos.filter((repo) => {
    const matchesSearch =
      !lowerSearch ||
      repo.name?.toLowerCase().includes(lowerSearch) ||
      repo.description?.toLowerCase().includes(lowerSearch);

    const matchesLanguage =
      language === "all" ||
      (repo.languages || []).some((entry) => entry.language === language);

    const repoTopics = Array.isArray(repo.topics) ? repo.topics : [];
    const matchesTag = tag === "all" || repoTopics.includes(tag);

    return matchesSearch && matchesLanguage && matchesTag;
  });
};

const firstRepo = repositories[0];
assert.ok(firstRepo.name, "Each repository should have a name");
const filteredByName = filterRepos(repositories, { search: firstRepo.name.slice(0, 3) });
assert.ok(filteredByName.length > 0, "Filtering by partial name should return results");

const availableLanguages = new Set();
repositories.forEach((repo) => {
  (repo.languages || []).forEach((entry) => {
    if (entry && typeof entry.language === "string") {
      availableLanguages.add(entry.language);
    }
  });
});

if (availableLanguages.size > 0) {
  const language = availableLanguages.values().next().value;
  const filteredByLang = filterRepos(repositories, { language });
  assert.ok(
    filteredByLang.every((repo) =>
      (repo.languages || []).some((entry) => entry.language === language),
    ),
    "Language filter should only return matching repositories",
  );
}

if (Array.isArray(firstRepo.topics) && firstRepo.topics.length > 0) {
  const tag = firstRepo.topics[0];
  const filteredByTag = filterRepos(repositories, { tag });
  assert.ok(
    filteredByTag.every((repo) => (repo.topics || []).includes(tag)),
    "Tag filter should only return repositories containing the tag",
  );
}

// Simulate log persistence behaviour
const storage = new Map();
const readLogs = () => {
  const raw = storage.get("actionLogs");
  if (!raw) return [];
  return JSON.parse(raw);
};
const writeLogs = (logs) => {
  storage.set("actionLogs", JSON.stringify(logs));
};

assert.deepEqual(readLogs(), [], "Log store should be empty initially");

const newLog = { time: new Date().toISOString(), type: "test", details: "unit" };
const logsAfterInsert = [...readLogs(), newLog].slice(-100);
writeLogs(logsAfterInsert);

const persisted = readLogs();
assert.equal(persisted.length, 1, "Log store should contain the appended entry");
assert.equal(persisted[0].type, "test", "Persisted log should retain its data");

console.log("All data and log checks passed.");

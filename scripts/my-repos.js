import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";
import { generateDerivedHouseData } from "../src/server/house-model.js";

dotenv.config({ override: true });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: GITHUB_TOKEN });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkAuth() {
  try {
    const { data } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${data.login}`);
    return data.login;
  } catch (error) {
    console.error("Authentication check failed:", error.message);
    throw error;
  }
}

function normalizeRepo(repo, login) {
  const primary = repo.language || "Unknown";
  return {
    name: repo.name,
    description: repo.description || "No description",
    author: repo.owner?.login || "unknown",
    stars: repo.stargazers_count || 0,
    url: repo.html_url,
    date: repo.created_at ? new Date(repo.created_at).toLocaleDateString() : "",
    languages: primary === "Unknown" ? [] : [{ language: primary, percentage: "100%" }],
    topics: repo.topics || [],
    primary_language: primary,
    license: repo.license?.spdx_id || "None",
    forks: repo.forks_count || 0,
    open_issues: repo.open_issues_count || 0,
    last_updated: new Date(repo.pushed_at || repo.updated_at || repo.created_at).toLocaleDateString(),
    last_updated_at: repo.pushed_at || repo.updated_at || repo.created_at,
    created_at: repo.created_at || null,
    private: repo.private || false,
    has_readme: null,
    is_owner: repo.owner?.login === login,
    is_fork: !!repo.fork,
  };
}

async function hasReadme(owner, repo) {
  try {
    await octokit.repos.getReadme({ owner, repo });
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    console.warn(`Readme check failed for ${owner}/${repo}: ${error.message}`);
    return null;
  }
}

async function getContent(owner, repo, filePath) {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    if (!("content" in data) || data.type !== "file") return null;
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch (error) {
    if (error.status !== 404) {
      console.warn(`Key file check failed for ${owner}/${repo}/${filePath}: ${error.message}`);
    }
    return null;
  }
}

async function pathExists(owner, repo, filePath) {
  try {
    await octokit.repos.getContent({ owner, repo, path: filePath });
    return true;
  } catch (error) {
    if (error.status !== 404) {
      console.warn(`Path check failed for ${owner}/${repo}/${filePath}: ${error.message}`);
    }
    return false;
  }
}

async function listWorkflowFiles(owner, repo) {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: ".github/workflows" });
    if (!Array.isArray(data)) return [];
    return data.filter((entry) => entry.type === "file").map((entry) => entry.name);
  } catch (error) {
    if (error.status !== 404) {
      console.warn(`Workflow check failed for ${owner}/${repo}: ${error.message}`);
    }
    return [];
  }
}

async function getKeyFiles(owner, repo) {
  const [
    packageJsonRaw,
    workflows,
    hasPnpmLock,
    hasYarnLock,
    hasPackageLock,
    hasVercel,
    hasNetlify,
    hasDockerfile,
  ] = await Promise.all([
    getContent(owner, repo, "package.json"),
    listWorkflowFiles(owner, repo),
    pathExists(owner, repo, "pnpm-lock.yaml"),
    pathExists(owner, repo, "yarn.lock"),
    pathExists(owner, repo, "package-lock.json"),
    pathExists(owner, repo, "vercel.json"),
    pathExists(owner, repo, "netlify.toml"),
    pathExists(owner, repo, "Dockerfile"),
  ]);

  const packageManagers = [];
  if (packageJsonRaw) packageManagers.push("npm");
  if (hasPnpmLock) packageManagers.push("pnpm");
  if (hasYarnLock) packageManagers.push("yarn");
  if (hasPackageLock) packageManagers.push("npm-lock");

  const deploymentConfigs = [];
  if (hasVercel) deploymentConfigs.push("vercel.json");
  if (hasNetlify) deploymentConfigs.push("netlify.toml");
  if (hasDockerfile) deploymentConfigs.push("Dockerfile");

  let packageJson = null;
  if (packageJsonRaw) {
    try {
      const parsed = JSON.parse(packageJsonRaw);
      packageJson = {
        scripts: parsed.scripts || {},
        dependencies: parsed.dependencies || {},
        devDependencies: parsed.devDependencies || {},
      };
    } catch {
      packageJson = null;
    }
  }

  return {
    packageJson,
    packageManagers,
    workflows,
    deploymentConfigs,
  };
}

async function mapWithConcurrency(items, limit, handler) {
  const results = new Array(items.length);
  let index = 0;
  const workers = new Array(limit).fill(0).map(async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await handler(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

async function getMyRepos() {
  const login = await checkAuth();
  const repos = await octokit.paginate("GET /user/repos", {
    visibility: "all",
    affiliation: "owner,collaborator,organization_member",
    per_page: 100,
    sort: "updated",
  });

  const normalized = repos.map((repo) => normalizeRepo(repo, login));
  const enriched = await mapWithConcurrency(normalized, 5, async (repo) => {
    const [has_readme, key_files] = await Promise.all([
      hasReadme(repo.author, repo.name),
      getKeyFiles(repo.author, repo.name),
    ]);
    return { ...repo, has_readme, key_files };
  });

  return enriched;
}

async function run() {
  try {
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is not set. Export it in your environment or .env file.");
    }

    console.log("Fetching your repositories (public + private)...");
    const myRepos = await getMyRepos();
    console.log(`Fetched ${myRepos.length} repos.`);

    const dataDir = path.resolve(__dirname, "../data");
    const publicDir = path.resolve(__dirname, "../public");

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    fs.writeFileSync(path.join(dataDir, "my-repos.json"), JSON.stringify(myRepos, null, 2));
    fs.writeFileSync(path.join(publicDir, "my-repos.json"), JSON.stringify(myRepos, null, 2));

    console.log("Saved my-repos.json to data/ and public/");
    await generateDerivedHouseData(path.resolve(__dirname, ".."), {
      myRepos,
    });
    console.log("Refreshed repo-signals, research-queue, skill-extractions, and mine-health snapshots.");
  } catch (error) {
    console.error("Failed to sync repos:", error.message);
    process.exit(1);
  }
}

run();

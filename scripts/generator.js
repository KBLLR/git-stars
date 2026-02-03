import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";
import PQueue from "p-queue";
import { generateStatistics } from "../src/analytics/statistics.js";

dotenv.config({ override: true });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = "KBLLR";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.resolve(__dirname, ".cache");
const LANGUAGE_CACHE_FILE = path.join(CACHE_DIR, "languages.json");

let languageCache = {};
try {
  if (fs.existsSync(LANGUAGE_CACHE_FILE)) {
    languageCache = JSON.parse(fs.readFileSync(LANGUAGE_CACHE_FILE, "utf-8"));
  }
} catch (error) {
  console.warn("Failed to load language cache. Rebuilding from scratch.", error);
  languageCache = {};
}

const languageQueue = new PQueue({
  concurrency: 10,
  interval: 60_000,
  intervalCap: 120, // Increased from 45 to 120 (approx 7200 req/hr burst, efficiently using limits)
});

function saveLanguageCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(
      LANGUAGE_CACHE_FILE,
      JSON.stringify(languageCache, null, 2),
    );
  } catch (error) {
    console.error("Failed to persist language cache:", error);
  }
}

async function checkAuth() {
  try {
    const { data } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${data.login}`);
  } catch (error) {
    console.error("Authentication check failed:", error.message);
  }
}

async function getStarredRepos(username) {
  try {
    await checkAuth(); // Verify auth before fetching

    // Use route string to ensure headers are applied correctly without interference
    return await octokit.paginate("GET /users/{username}/starred", {
      username,
      per_page: 100,
      headers: {
        accept: "application/vnd.github.star+json",
      },
    });
  } catch (error) {
    console.error("Error fetching starred repositories:", error);
    throw error;
  }
}

async function getRepoLanguages(owner, repo) {
  try {
    const { data } = await octokit.repos.listLanguages({ owner, repo });
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    return Object.entries(data).map(([lang, bytes]) => ({
      language: lang,
      percentage: total > 0 ? ((bytes / total) * 100).toFixed(1) + "%" : "N/A",
    }));
  } catch (error) {
    console.error(`Error fetching languages for ${owner}/${repo}:`, error);
    return null;
  }
}

async function transformData(starredRepos) {
  const reposByLanguage = {};

  const reposWithLanguages = await Promise.all(
    starredRepos.map((starredRepo) =>
      languageQueue.add(async () => {
        const repo = starredRepo.repo;
        const cacheKey = `${repo.owner.login}/${repo.name}`;
        const signature =
          repo.pushed_at || repo.updated_at || starredRepo.starred_at || "unknown";

        let languages = [];
        const cachedEntry = languageCache[cacheKey];

        if (cachedEntry && cachedEntry.signature === signature) {
          languages = cachedEntry.languages;
        } else {
          const fetchedLanguages = await getRepoLanguages(
            repo.owner.login,
            repo.name,
          );
          if (fetchedLanguages) {
            languages = fetchedLanguages;
            languageCache[cacheKey] = {
              signature,
              languages,
              cachedAt: new Date().toISOString(),
            };
          } else if (cachedEntry) {
            languages = cachedEntry.languages;
          }
        }

        return {
          ...starredRepo,
          enhancedRepo: {
            ...repo,
            languages,
            topics: repo.topics || [],
          },
        };
      }),
    ),
  );

  reposWithLanguages.forEach(({ enhancedRepo, starred_at }) => {
    // Use the repository language if available, otherwise use "Unknown"
    const language = enhancedRepo.language || "Unknown";
    const primaryLanguage =
      enhancedRepo.language ||
      (enhancedRepo.languages && enhancedRepo.languages[0]
        ? enhancedRepo.languages[0].language
        : "Unknown");

    const repoData = {
      name: enhancedRepo.name,
      description: enhancedRepo.description || "No description",
      author: enhancedRepo.owner.login,
      stars: enhancedRepo.stargazers_count,
      url: enhancedRepo.html_url,
      date: new Date(starred_at).toLocaleDateString(),
      languages: enhancedRepo.languages,
      topics: enhancedRepo.topics,
      primary_language: primaryLanguage,
      license: enhancedRepo.license?.spdx_id || "None",
      forks: enhancedRepo.forks_count,
      open_issues: enhancedRepo.open_issues_count,
      last_updated: new Date(enhancedRepo.pushed_at).toLocaleDateString(),
    };

    if (!reposByLanguage[language]) {
      reposByLanguage[language] = { language, repos: [] };
    }
    reposByLanguage[language].repos.push(repoData);
  });

  return Object.values(reposByLanguage);
}

async function generate() {
  try {
    console.log("Fetching starred repositories...");
    const starredRepos = await getStarredRepos(USERNAME);
    console.log(`Fetched ${starredRepos.length} repositories.`);

    console.log("Processing repository data...");
    const transformedData = await transformData(starredRepos);
    saveLanguageCache();

    // Output file paths
    const DATA_DIR = path.resolve("data");
    const PUBLIC_DIR = path.resolve("public");

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

    // Save flat data for consumption
    const flattenedData = transformedData.flatMap(g => g.repos || []);
    
    // 1. Save to data/data.json (Source of truth for MCP)
    fs.writeFileSync(path.join(DATA_DIR, "data.json"), JSON.stringify(flattenedData, null, 2));

    // 2. Save to public/data.json (For Frontend consumption)
    fs.writeFileSync(path.join(PUBLIC_DIR, "data.json"), JSON.stringify(flattenedData, null, 2));

    console.log(`Saved ${flattenedData.length} repos to data/data.json and public/data.json`);

    console.log("Generating statistics...");
    await generateStatistics(); // This generates stats.json in data/stats.json
    
    // Copy stats to public for frontend
    if (fs.existsSync(path.join(DATA_DIR, "stats.json"))) {
        fs.copyFileSync(path.join(DATA_DIR, "stats.json"), path.join(PUBLIC_DIR, "stats.json"));
        console.log("Copied stats.json to public/");
    }

  } catch (error) {
    console.error("Error during generation:", error);
    process.exit(1);
  }
}

generate();

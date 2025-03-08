import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";
import PQueue from "p-queue";
import { log } from "./logging.js";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;
const MAX_RETRIES = 3;
const CONCURRENT_REQUESTS = 5;
const OUTPUT_FILE = "index.html";
const TEMPLATE_FILE = "template.html";

if (!GITHUB_TOKEN || !USERNAME) {
  log("Missing GITHUB_TOKEN or GITHUB_USERNAME in .env file", "error");
  process.exit(1);
}

const queue = new PQueue({ concurrency: CONCURRENT_REQUESTS });
const headers = { Authorization: `Bearer ${GITHUB_TOKEN}` };

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  try {
    log(`Fetching: ${url}`, "info");
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    if (retries > 0 && error.response?.status === 403) {
      log(
        `Rate limit exceeded. Retrying in 5s... (${retries} retries left)`,
        "warning",
      );
      await new Promise((res) => setTimeout(res, 5000));
      return fetchWithRetry(url, retries - 1);
    }
    log(`Failed to fetch ${url}: ${error.message}`, "error");
    return null;
  }
}

async function getStarredRepos() {
  let page = 1;
  let repos = [];
  log("Fetching starred repositories...", "info");

  while (true) {
    const url = `https://api.github.com/users/${USERNAME}/starred?per_page=100&page=${page}`;
    const data = await fetchWithRetry(url);
    if (!data || data.length === 0) break;
    repos = [...repos, ...data];
    log(`Fetched ${data.length} repos from page ${page}`, "success");
    page++;
  }

  log(`Total starred repositories fetched: ${repos.length}`, "success");
  return repos;
}

async function getRepoLanguages(repo) {
  return queue.add(async () => {
    try {
      const languages = await fetchWithRetry(repo.languages_url);
      return languages || {};
    } catch (error) {
      log(`Failed to fetch languages for ${repo.name}`, "error");
      return {};
    }
  });
}

async function generateContent() {
  const repos = await getStarredRepos();
  const languagesMap = {};

  await Promise.all(
    repos.map(async (repo) => {
      languagesMap[repo.name] = await getRepoLanguages(repo);
    }),
  );

  const transformedData = repos.map((repo) => ({
    name: repo.name,
    description: repo.description || "No description",
    author: repo.owner?.login || "Unknown",
    stars: repo.stargazers_count || 0,
    url: repo.html_url,
    language: repo.language || "Unknown",
    topics: repo.topics || [],
    license: repo.license?.spdx_id || "None",
    last_updated: repo.pushed_at,
    languages: Object.keys(languagesMap[repo.name]).join(", ") || "N/A",
  }));

  const repoHTML = transformedData
    .map(
      (repo) => `
      <div class="repo-card">
        <h3><a href="${repo.url}" target="_blank">${repo.name}<i class="fas fa-external-link-alt"></i></a></h3>
        <p>${repo.description}</p>
        <p><i class="fas fa-star"></i> <strong>Stars:</strong> ${repo.stars}</p>
        <p><i class="fas fa-code"></i> <strong>Language:</strong> ${repo.language}</p>
        <p><i class="fas fa-scroll"></i> <strong>License:</strong> ${repo.license}</p>
        <p><i class="fas fa-clock"></i> <strong>Last Updated:</strong> ${new Date(repo.last_updated).toLocaleDateString()}</p>
      </div>
    `,
    )
    .join("");

  let template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  template = template.replace("{{reposContainer}}", repoHTML);
  fs.writeFileSync(OUTPUT_FILE, template);

  log("✅ index.html generated successfully!", "success");
}

generateContent().catch((error) =>
  log(`Unhandled error: ${error.message}`, "error"),
);

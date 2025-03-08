import dotenv from "dotenv";
import fs from "fs";
import PQueue from "p-queue";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;
const MAX_RETRIES = 3;
const CONCURRENT_REQUESTS = 5;

// Validate required environment variables
if (!GITHUB_TOKEN || !USERNAME) {
  console.error(
    "Error: GITHUB_TOKEN and GITHUB_USERNAME are required in .env file",
  );
  process.exit(1);
}

// GitHub API client with rate limiting and retries
class GitHubAPIClient {
  constructor(token) {
    this.token = token;
    this.queue = new PQueue({ concurrency: CONCURRENT_REQUESTS });
    this.headers = {
      Accept: "application/vnd.github.v3.star+json",
      Authorization: `Bearer ${token}`,
    };
  }

  async checkRateLimit() {
    const response = await fetch("https://api.github.com/rate_limit", {
      headers: this.headers,
    });
    const rateLimit = await response.json();
    return rateLimit.resources.core.remaining;
  }

  async fetchWithRetry(url, retries = MAX_RETRIES) {
    try {
      const remaining = await this.checkRateLimit();
      if (remaining < 1) {
        throw new Error("Rate limit exceeded");
      }
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (retries > 0 && error.message.includes("Rate limit")) {
        const waitTime = Math.pow(2, MAX_RETRIES - retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  async getStarredRepos(username) {
    let page = 1;
    let allStarredRepos = [];
    let hasMore = true;
    while (hasMore) {
      const url = `https://api.github.com/users/${username}/starred?per_page=100&page=${page}`;
      const data = await this.fetchWithRetry(url);
      if (!Array.isArray(data)) {
        throw new Error("Invalid API response format");
      }
      allStarredRepos = allStarredRepos.concat(data);
      hasMore = data.length === 100;
      page++;
    }
    return allStarredRepos;
  }

  async getRepoLanguages(repo) {
    return this.queue.add(async () => {
      try {
        return await this.fetchWithRetry(repo.languages_url);
      } catch (error) {
        console.error(`Failed to fetch languages for ${repo.name}:`, error);
        return {};
      }
    });
  }
}

// Data transformer with validation and custom date formatting
class DataTransformer {
  static formatDate(dateString) {
    const d = new Date(dateString);
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  static validateRepo(repo) {
    return {
      name: repo.name || "Unnamed Repository",
      description: repo.description || "No description available",
      author: repo?.owner?.login || "Unknown Author",
      stars: repo.stargazers_count || 0,
      url: repo.html_url || "#",
      language: repo.language || "Unknown",
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      license: repo?.license?.spdx_id || "None",
      forks: repo.forks_count || 0,
      open_issues: repo.open_issues_count || 0,
      last_updated: repo.pushed_at
        ? this.formatDate(repo.pushed_at)
        : "Unknown",
    };
  }

  static calculateLanguagePercentages(languages) {
    const totalBytes = Object.values(languages).reduce(
      (sum, val) => sum + val,
      0,
    );
    return Object.entries(languages).map(([lang, bytes]) => ({
      language: lang,
      percentage:
        totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) + "%" : "0.0%",
    }));
  }

  static transformData(starredRepos, allLanguages) {
    const reposByLanguage = {};
    starredRepos.forEach((starredRepo) => {
      const validated = this.validateRepo(starredRepo.repo);
      // Add the starred date in the custom format
      validated.starred_at = starredRepo.starred_at
        ? this.formatDate(starredRepo.starred_at)
        : "Unknown";
      const languages = allLanguages[validated.name] || {};
      const languagePercentages = this.calculateLanguagePercentages(languages);
      if (!reposByLanguage[validated.language]) {
        reposByLanguage[validated.language] = {
          language: validated.language,
          repos: [],
        };
      }
      reposByLanguage[validated.language].repos.push({
        ...validated,
        languages: languagePercentages,
      });
    });
    return Object.values(reposByLanguage);
  }
}

// HTML Generator with security measures
class HTMLGenerator {
  static escapeHtml(unsafe) {
    return String(unsafe).replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[char];
    });
  }

  static generateRepoCard(repo) {
    return `
      <div class="repo-card">
        <div class="repo-card-header">
          <h3><a href="${this.escapeHtml(repo.url)}" target="_blank">${this.escapeHtml(repo.name)}</a></h3>
          <p><strong>Author:</strong> ${this.escapeHtml(repo.author)}</p>
        </div>
        <div class="repo-card-content">
          <p class="repo-description">
            <strong>Description:</strong> ${this.escapeHtml(repo.description)}
          </p>
          <div class="metrics">
            <div class="metric"><i class="fa fa-star"></i> ${repo.stars}</div>
            <div class="metric"><i class="fa fa-code-branch"></i> ${repo.forks}</div>
            <div class="metric"><i class="fa fa-bug"></i> ${repo.open_issues}</div>
            <div class="metric"><i class="fa fa-calendar"></i> ${this.escapeHtml(repo.last_updated)}</div>
          </div>
          <div class="languages">
            ${repo.languages.map((l) => `${this.escapeHtml(l.language)} (${this.escapeHtml(l.percentage)})`).join(", ")}
          </div>
          <div class="topics">
            ${repo.topics.map((t) => this.escapeHtml(t)).join(", ") || "None"}
          </div>
          <div class="starred-date">
            <strong>Starred on:</strong> ${this.escapeHtml(repo.starred_at)}
          </div>
        </div>
      </div>
    `;
  }

  static generateHTML(data) {
    return data
      .map(
        (langGroup) => `
          <section class="language-group">
            <h2>${this.escapeHtml(langGroup.language)}</h2>
            ${langGroup.repos.map((repo) => this.generateRepoCard(repo)).join("\n")}
          </section>
        `,
      )
      .join("\n");
  }
}

// File operations handler
class FileHandler {
  static async readTemplate() {
    try {
      return await fs.promises.readFile("template.html", "utf8");
    } catch (error) {
      console.error("Error reading template file:", error);
      throw error;
    }
  }

  static async writeOutput(template, reposHtml, data) {
    try {
      // Write the data file including additional statistics
      await fs.promises.writeFile("data.json", JSON.stringify(data, null, 2));
      // Update the HTML file
      const updatedHtml = template.replace("{{reposContainer}}", reposHtml);
      await fs.promises.writeFile("index.html", updatedHtml);
    } catch (error) {
      console.error("Error writing output files:", error);
      throw error;
    }
  }
}

// Main generator function
async function generate() {
  try {
    console.log("Initializing GitHub API client...");
    const github = new GitHubAPIClient(GITHUB_TOKEN);

    console.log("Fetching starred repositories...");
    const starredRepos = await github.getStarredRepos(USERNAME);
    console.log(`Fetched ${starredRepos.length} repositories`);

    console.log("Fetching languages for all repositories...");
    const languagePromises = starredRepos.map((starred) =>
      github.getRepoLanguages(starred.repo),
    );
    const languages = await Promise.all(languagePromises);
    const allLanguages = Object.fromEntries(
      starredRepos.map((starred, i) => [starred.repo.name, languages[i]]),
    );

    console.log("Transforming data...");
    const transformedData = DataTransformer.transformData(
      starredRepos,
      allLanguages,
    );

    console.log("Reading template file...");
    const template = await FileHandler.readTemplate();

    console.log("Generating HTML...");
    const reposHtml = HTMLGenerator.generateHTML(transformedData);

    // Additional Statistics
    const totalRepos = starredRepos.length;
    const totalStars = starredRepos.reduce(
      (sum, s) => sum + s.repo.stargazers_count,
      0,
    );
    const totalForks = starredRepos.reduce(
      (sum, s) => sum + s.repo.forks_count,
      0,
    );
    const totalOpenIssues = starredRepos.reduce(
      (sum, s) => sum + s.repo.open_issues_count,
      0,
    );
    const avgStars = (totalStars / totalRepos).toFixed(1);
    const avgForks = (totalForks / totalRepos).toFixed(1);
    const avgOpenIssues = (totalOpenIssues / totalRepos).toFixed(1);

    // Language distribution
    const languageDistribution = {};
    starredRepos.forEach((s) => {
      const lang = s.repo.language || "Unknown";
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    });

    console.log("Writing output files...");
    await FileHandler.writeOutput(template, reposHtml, {
      repos: transformedData,
      stats: {
        totalRepos,
        totalStars,
        totalForks,
        totalOpenIssues,
        avgStars,
        avgForks,
        avgOpenIssues,
        languageDistribution,
      },
    });

    console.log("Generation completed successfully!");
  } catch (error) {
    console.error("Fatal error during generation:", error);
    process.exit(1);
  }
}

generate();

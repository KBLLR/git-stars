#!/usr/bin/env node

/**
 * Statistics Generator for git-stars
 * Generates comprehensive statistics from starred repository data
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "../../data/data.json");
const STATS_FILE = path.resolve(__dirname, "../../data/stats.json");

/**
 * Load repository data
 */
async function loadData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(content);

    // Handle both formats: grouped by language or flat array
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].repos) {
        return data.flatMap(group => group.repos || []);
      }
      return data;
    }
    return [];
  } catch (error) {
    console.error("Error loading data:", error.message);
    throw error;
  }
}

/**
 * Calculate comprehensive statistics
 */
function calculateStatistics(repos) {
  console.log(`Calculating statistics for ${repos.length} repositories...`);

  const now = new Date();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const SIX_MONTHS = 180 * ONE_DAY;
  const TWO_YEARS = 730 * ONE_DAY;

  const stats = {
    generated_at: now.toISOString(),
    summary: {
      total_repos: repos.length,
      total_stars: 0,
      total_forks: 0,
      total_open_issues: 0,
      average_stars: 0,
      average_forks: 0,
    },
    languages: {},
    topics: {},
    licenses: {},
    authors: {},
    yearly_activity: {},
    staleness: {
      active: 0, // < 6 months
      stable: 0, // 6 months - 2 years
      archived: 0, // > 2 years
    },
    hidden_gems: [], // High stars, low forks, active
    tech_clusters: {}, // Co-occurrence of topics
    top_repos: {
      by_stars: [],
      by_forks: [],
      by_activity: [],
      by_hype: [], // Stars / Age
    },
    distributions: {
      stars_ranges: {
        "0-10": 0,
        "11-50": 0,
        "51-100": 0,
        "101-500": 0,
        "501-1000": 0,
        "1000+": 0,
      },
      forks_ranges: {
        "0-5": 0,
        "6-25": 0,
        "26-100": 0,
        "101-500": 0,
        "500+": 0,
      },
    },
  };

  const topicPairs = {};

  // Process each repository
  repos.forEach((repo) => {
    const stars = repo.stars || 0;
    const forks = repo.forks || 0;
    const issues = repo.open_issues || 0;
    const lastUpdated = repo.last_updated ? new Date(repo.last_updated) : null;

    // Summary calculations
    stats.summary.total_stars += stars;
    stats.summary.total_forks += forks;
    stats.summary.total_open_issues += issues;

    // Staleness
    if (lastUpdated) {
      const diff = now - lastUpdated;
      if (diff < SIX_MONTHS) stats.staleness.active++;
      else if (diff < TWO_YEARS) stats.staleness.stable++;
      else stats.staleness.archived++;
    }

    // Hidden Gems: > 500 stars, forks < 10% of stars, active in lat 2 years
    if (stars > 500 && forks < stars * 0.1 && lastUpdated && (now - lastUpdated) < TWO_YEARS) {
      stats.hidden_gems.push({
        name: repo.name,
        stars,
        forks,
        description: repo.description,
        url: repo.url
      });
    }

    // Language breakdown
    let primaryLang = repo.primary_language || repo.language;

    // If not found, try to get from languages array
    if (
      !primaryLang &&
      Array.isArray(repo.languages) &&
      repo.languages.length > 0
    ) {
      primaryLang = repo.languages[0].language;
    }

    primaryLang = primaryLang || "Unknown";

    if (!stats.languages[primaryLang]) {
      stats.languages[primaryLang] = {
        count: 0,
        total_stars: 0,
        total_forks: 0,
        repos: [],
      };
    }
    stats.languages[primaryLang].count++;
    stats.languages[primaryLang].total_stars += stars;
    stats.languages[primaryLang].total_forks += forks;
    stats.languages[primaryLang].repos.push({
      name: repo.name,
      author: repo.author,
      stars,
    });

    // Topics frequency & Co-occurrence
    const topics = Array.isArray(repo.topics) ? repo.topics : [];
    
    // Track individual topics
    topics.forEach((topic) => {
      if (!stats.topics[topic]) {
        stats.topics[topic] = {
          count: 0,
          total_stars: 0,
          repos: [],
        };
      }
      stats.topics[topic].count++;
      stats.topics[topic].total_stars += stars;
      stats.topics[topic].repos.push(repo.name);
    });

    // Track topic pairs for clusters (only for top topics later)
    if (topics.length > 1) {
        for (let i = 0; i < topics.length; i++) {
            for (let j = i + 1; j < topics.length; j++) {
                const t1 = topics[i];
                const t2 = topics[j];
                const pair = t1 < t2 ? `${t1}|${t2}` : `${t2}|${t1}`;
                topicPairs[pair] = (topicPairs[pair] || 0) + 1;
            }
        }
    }

    // License breakdown
    const license = repo.license || "None";
    stats.licenses[license] = (stats.licenses[license] || 0) + 1;

    // Author breakdown
    const author = repo.author || "Unknown";
    if (!stats.authors[author]) {
      stats.authors[author] = {
        count: 0,
        total_stars: 0,
        repos: [],
      };
    }
    stats.authors[author].count++;
    stats.authors[author].total_stars += stars;
    stats.authors[author].repos.push(repo.name);

    // Yearly activity (based on last_updated)
    if (lastUpdated) {
      const year = lastUpdated.getFullYear();
      if (!isNaN(year) && year > 2000 && year <= now.getFullYear()) {
        stats.yearly_activity[year] = (stats.yearly_activity[year] || 0) + 1;
      }
    }

    // Star distribution
    if (stars === 0) stats.distributions.stars_ranges["0-10"]++;
    else if (stars <= 10) stats.distributions.stars_ranges["0-10"]++;
    else if (stars <= 50) stats.distributions.stars_ranges["11-50"]++;
    else if (stars <= 100) stats.distributions.stars_ranges["51-100"]++;
    else if (stars <= 500) stats.distributions.stars_ranges["101-500"]++;
    else if (stars <= 1000) stats.distributions.stars_ranges["501-1000"]++;
    else stats.distributions.stars_ranges["1000+"]++;

    // Fork distribution
    if (forks === 0) stats.distributions.forks_ranges["0-5"]++;
    else if (forks <= 5) stats.distributions.forks_ranges["0-5"]++;
    else if (forks <= 25) stats.distributions.forks_ranges["6-25"]++;
    else if (forks <= 100) stats.distributions.forks_ranges["26-100"]++;
    else if (forks <= 500) stats.distributions.forks_ranges["101-500"]++;
    else stats.distributions.forks_ranges["500+"]++;
  });

  // Calculate averages
  stats.summary.average_stars = (
    stats.summary.total_stars / repos.length
  ).toFixed(2);
  stats.summary.average_forks = (
    stats.summary.total_forks / repos.length
  ).toFixed(2);

  // Hidden Gems sorting
  stats.hidden_gems.sort((a, b) => b.stars - a.stars);
  stats.hidden_gems = stats.hidden_gems.slice(0, 20);

  // Tech Clusters - filtering top pairs
  stats.tech_clusters = Object.entries(topicPairs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
    }, {});

  // Get top repos
  const mapRepo = (r) => ({
    name: r.name,
    author: r.author,
    stars: r.stars,
    forks: r.forks,
    description: r.description,
    url: r.url,
    language: r.primary_language || r.language,
    topics: r.topics,
    last_updated: r.last_updated,
  });

  stats.top_repos.by_stars = repos
    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
    .slice(0, 50)
    .map(mapRepo);

  stats.top_repos.by_forks = repos
    .sort((a, b) => (b.forks || 0) - (a.forks || 0))
    .slice(0, 50)
    .map(mapRepo);

  stats.top_repos.by_activity = repos
    .filter((r) => r.last_updated)
    .sort(
      (a, b) => new Date(b.last_updated) - new Date(a.last_updated),
    )
    .slice(0, 50)
    .map(mapRepo);

  // Hype Factor: Stars / Days Old (approx using last_updated as a proxy for "liveness" and we don't have created_at in clean data sometimes)
  // Ideally we use date starred 'starred_at' vs today for user-hype, or we need created_at.
  // The data transformation in generator.js keeps pushed_at/updated_at/starred_at as 'date' (starred_at) and 'last_updated' (pushed_at).
  // We don't have created_at readily available in the flattened object. We will skip Hype Factor for now or use Stars alone.
  // Let's rely on Hidden Gems as a "High Interest" proxy.
  
  // Sort and limit language data
  stats.languages = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b.count - a.count)
    .reduce((obj, [key, val]) => {
      obj[key] = {
        ...val,
        percentage: ((val.count / repos.length) * 100).toFixed(2) + "%",
        repos: val.repos.slice(0, 10), // Keep only top 10 repos per language
      };
      return obj;
    }, {});

  // Sort and limit topic data
  stats.topics = Object.entries(stats.topics)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 100) // Top 100 topics
    .reduce((obj, [key, val]) => {
      obj[key] = {
        ...val,
        repos: val.repos.slice(0, 5), // Keep only top 5 repos per topic
      };
      return obj;
    }, {});

  // Sort and limit author data
  stats.authors = Object.entries(stats.authors)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 50) // Top 50 authors
    .reduce((obj, [key, val]) => {
      obj[key] = {
        ...val,
        repos: val.repos.slice(0, 5), // Keep only top 5 repos per author
      };
      return obj;
    }, {});

  // Sort licenses
  stats.licenses = Object.entries(stats.licenses)
    .sort(([, a], [, b]) => b - a)
    .reduce((obj, [key, val]) => {
      obj[key] = {
        count: val,
        percentage: ((val / repos.length) * 100).toFixed(2) + "%",
      };
      return obj;
    }, {});

  // Sort yearly activity
  stats.yearly_activity = Object.entries(stats.yearly_activity)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {});

  return stats;
}

/**
 * Generate and save statistics
 */
async function generateStatistics() {
  try {
    console.log("Loading repository data...");
    const repos = await loadData();

    console.log(`Loaded ${repos.length} repositories`);

    const stats = calculateStatistics(repos);

    // Ensure data directory exists
    const dataDir = path.dirname(STATS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    // Save statistics
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));

    console.log(`Statistics saved to ${STATS_FILE}`);
    console.log("\nSummary:");
    console.log(`  Total repositories: ${stats.summary.total_repos}`);
    console.log(`  Total stars: ${stats.summary.total_stars.toLocaleString()}`);
    console.log(`  Total forks: ${stats.summary.total_forks.toLocaleString()}`);
    console.log(`  Average stars per repo: ${stats.summary.average_stars}`);
    console.log(`  Languages tracked: ${Object.keys(stats.languages).length}`);
    console.log(`  Topics tracked: ${Object.keys(stats.topics).length}`);
    console.log(`  Top language: ${Object.keys(stats.languages)[0]}`);
    console.log(`  Most popular topic: ${Object.keys(stats.topics)[0]}`);

    return stats;
  } catch (error) {
    console.error("Error generating statistics:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStatistics();
}

export { generateStatistics, calculateStatistics };

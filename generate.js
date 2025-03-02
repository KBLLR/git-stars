import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = "KBLLR";

if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN is missing in the .env file.");
  process.exit(1);
}

async function getStarredRepos(username, token) {
  const headers = {
    Accept:
      "application/vnd.github.v3.star+json, application/vnd.github.mercy-preview+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let page = 1;
  let repos = [];
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.github.com/users/${username}/starred?per_page=100&page=${page}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    repos = repos.concat(data);

    const linkHeader = response.headers.get("Link");
    hasMore = linkHeader?.includes('rel="next"');
    page++;
  }

  return repos;
}

async function getRepoLanguages(languagesUrl, token) {
  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(languagesUrl, { headers });
    if (!response.ok) return null;
    const data = await response.json();
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    return Object.entries(data).map(([lang, bytes]) => ({
      language: lang,
      percentage: total > 0 ? ((bytes / total) * 100).toFixed(1) + "%" : "N/A",
    }));
  } catch (error) {
    console.error(`Error fetching languages for ${languagesUrl}:`, error);
    return null;
  }
}

async function transformData(starredRepos) {
  const reposByLanguage = {};

  // Process repositories in parallel
  const reposWithLanguages = await Promise.all(
    starredRepos.map(async (starredRepo) => {
      const repo = starredRepo.repo;
      const languages = await getRepoLanguages(
        repo.languages_url,
        GITHUB_TOKEN,
      );

      return {
        ...starredRepo,
        enhancedRepo: {
          ...repo,
          languages: languages || [],
          topics: repo.topics || [],
        },
      };
    }),
  );

  // Group repositories by primary language
  reposWithLanguages.forEach(({ enhancedRepo, starred_at }) => {
    const language = enhancedRepo.language || "Unknown";
    const repoData = {
      name: enhancedRepo.name,
      description: enhancedRepo.description || "No description",
      author: enhancedRepo.owner.login,
      stars: enhancedRepo.stargazers_count,
      url: enhancedRepo.html_url,
      date: new Date(starred_at).toLocaleDateString(),
      languages: enhancedRepo.languages,
      topics: enhancedRepo.topics,
      license: enhancedRepo.license?.spdx_id || "None",
      forks: enhancedRepo.forks_count,
      last_updated: new Date(enhancedRepo.pushed_at).toLocaleDateString(),
    };

    if (!reposByLanguage[language]) {
      reposByLanguage[language] = { language, repos: [] };
    }
    reposByLanguage[language].repos.push(repoData);
  });

  return Object.values(reposByLanguage);
}

function escapeHtml(unsafe) {
  return unsafe.replace(
    /[&<>"']/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[match],
  );
}

function generateHTML(data) {
  let html = "<h1>Your Starred Repositories</h1>";

  for (const langGroup of data) {
    html += `<h2>${escapeHtml(langGroup.language)}</h2>`;
    html += `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Author</th>
            <th>Stars</th>
            <th>Languages</th>
            <th>Tags</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>`;

    for (const repo of langGroup.repos) {
      html += `
          <tr>
            <td><a href="${escapeHtml(repo.url)}">${escapeHtml(repo.name)}</a></td>
            <td>${escapeHtml(repo.description)}</td>
            <td>${escapeHtml(repo.author)}</td>
            <td>${escapeHtml(String(repo.stars))}</td>
            <td>${
              repo.languages.length > 0
                ? repo.languages
                    .map(
                      (l) =>
                        `${escapeHtml(l.language)} (${escapeHtml(l.percentage)})`,
                    )
                    .join(", ")
                : "N/A"
            }</td>
            <td>${
              repo.topics.length > 0
                ? repo.topics
                    .map((t) => `<span class="topic">${escapeHtml(t)}</span>`)
                    .join(" ")
                : "None"
            }</td>
            <td>${escapeHtml(repo.date)}</td>
          </tr>`;
    }

    html += `</tbody></table>`;
  }

  return html;
}

async function generate() {
  try {
    console.log("Fetching starred repositories...");
    const starredRepos = await getStarredRepos(USERNAME, GITHUB_TOKEN);
    console.log(`Fetched ${starredRepos.length} repositories.`);

    console.log("Processing repository data...");
    const transformedData = await transformData(starredRepos);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Starred Repositories</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  padding: 0;
                  background-color: #f8f9fa;
              }
              h1, h2 {
                  color: #2d333b;
                  border-bottom: 2px solid #e1e4e8;
                  padding-bottom: 0.3em;
              }
              table {
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 20px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
                  background: white;
              }
              th, td {
                  border: 1px solid #e1e4e8;
                  padding: 12px;
                  text-align: left;
              }
              th {
                  background-color: #f6f8fa;
                  font-weight: 600;
              }
              a {
                  text-decoration: none;
                  color: #0969da;
              }
              a:hover {
                  text-decoration: underline;
              }
              .topic {
                  display: inline-block;
                  background: #e1e4e8;
                  border-radius: 2em;
                  padding: 0.2em 0.8em;
                  margin: 0.2em;
                  font-size: 0.85em;
                  color: #2d333b;
              }
              tr:hover {
                  background-color: #f6f8fa;
              }
          </style>
      </head>
      <body>
      ${generateHTML(transformedData)}
      </body>
      </html>`;

    fs.writeFileSync("index.html", htmlContent);
    fs.writeFileSync("data.json", JSON.stringify(transformedData, null, 2));
    console.log("Files saved: index.html and data.json");
  } catch (error) {
    console.error("Error during generation:", error);
  }
}

generate();

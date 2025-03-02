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
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Starred Repositories</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        h1, h2 {
          color: #333;
          text-align: center;
        }
        .view-toggle {
          text-align: center;
          margin-bottom: 20px;
        }
        .view-toggle button {
          padding: 10px 20px;
          margin: 0 10px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          background-color: #007acc;
          color: #fff;
          font-size: 1em;
        }
        .view {
          display: none;
        }
        #cards-view {
          display: block;
        }
        .card-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
          margin-bottom: 40px;
        }
        .card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 20px;
          width: 300px;
          transition: transform 0.2s;
        }
        .card:hover {
          transform: translateY(-5px);
        }
        .card h3 {
          margin-top: 0;
          font-size: 1.2em;
          color: #007acc;
        }
        .card a {
          text-decoration: none;
          color: inherit;
        }
        .description {
          font-size: 0.95em;
          margin: 10px 0;
          color: #555;
        }
        .details, .languages, .topics, .date {
          font-size: 0.85em;
          color: #666;
          margin: 5px 0;
        }
        .details span {
          display: block;
        }
        .topics .topic {
          display: inline-block;
          background: #e1e4e8;
          border-radius: 12px;
          padding: 3px 8px;
          margin: 2px;
          font-size: 0.75em;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
          background: #fff;
        }
        table th, table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        table th {
          background-color: #f2f2f2;
        }
      </style>
    </head>
    <body>
      <h1>Your Starred Repositories</h1>
      <div class="view-toggle">
        <button id="show-cards">Cards View</button>
        <button id="show-table">Table View</button>
      </div>

      <!-- Cards View -->
      <div id="cards-view" class="view">
  `;

  // Cards view generation
  data.forEach((langGroup) => {
    html += `<h2>${escapeHtml(langGroup.language)}</h2>`;
    html += `<div class="card-container">`;
    langGroup.repos.forEach((repo) => {
      html += `
        <div class="card" data-language="${escapeHtml(langGroup.language)}">
          <h3><a href="${escapeHtml(repo.url)}" target="_blank">${escapeHtml(repo.name)}</a></h3>
          <p class="description">${escapeHtml(repo.description)}</p>
          <div class="details">
            <span>Author: ${escapeHtml(repo.author)}</span>
            <span>Stars: ${escapeHtml(String(repo.stars))}</span>
          </div>
          <div class="languages">
            ${
              repo.languages.length > 0
                ? repo.languages
                    .map(
                      (l) =>
                        `<span>${escapeHtml(l.language)} (${escapeHtml(l.percentage)})</span>`,
                    )
                    .join(" | ")
                : "Languages: N/A"
            }
          </div>
          <div class="topics">
            ${
              repo.topics.length > 0
                ? repo.topics
                    .map((t) => `<span class="topic">${escapeHtml(t)}</span>`)
                    .join(" ")
                : "No topics"
            }
          </div>
          <div class="date">Starred on: ${escapeHtml(repo.date)}</div>
        </div>
      `;
    });
    html += `</div>`;
  });

  html += `</div>`;

  // Table View generation
  html += `
      <div id="table-view" class="view">
        <h2 style="text-align:center;">Table View</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Author</th>
              <th>Stars</th>
              <th>Languages</th>
              <th>Topics</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
  `;
  data.forEach((langGroup) => {
    langGroup.repos.forEach((repo) => {
      html += `
        <tr>
          <td><a href="${escapeHtml(repo.url)}" target="_blank">${escapeHtml(repo.name)}</a></td>
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
          <td>${repo.topics.length > 0 ? repo.topics.join(", ") : "None"}</td>
          <td>${escapeHtml(repo.date)}</td>
        </tr>
      `;
    });
  });
  html += `
          </tbody>
        </table>
      </div>

      <script>
        // Toggle view functionality
        document.getElementById('show-cards').addEventListener('click', function() {
          document.getElementById('cards-view').style.display = 'block';
          document.getElementById('table-view').style.display = 'none';
        });
        document.getElementById('show-table').addEventListener('click', function() {
          document.getElementById('cards-view').style.display = 'none';
          document.getElementById('table-view').style.display = 'block';
        });
      </script>
    </body>
    </html>
  `;
  return html;
}

async function generate() {
  try {
    console.log("Fetching starred repositories...");
    const starredRepos = await getStarredRepos(USERNAME, GITHUB_TOKEN);
    console.log(`Fetched ${starredRepos.length} repositories.`);

    console.log("Processing repository data...");
    const transformedData = await transformData(starredRepos);

    const htmlContent = generateHTML(transformedData);

    fs.writeFileSync("index.html", htmlContent);
    fs.writeFileSync("data.json", JSON.stringify(transformedData, null, 2));
    console.log("Files saved: index.html and data.json");
  } catch (error) {
    console.error("Error during generation:", error);
  }
}

generate();

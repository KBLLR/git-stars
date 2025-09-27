import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";
import PQueue from "p-queue";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = "KBLLR";

if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN is missing in the .env file.");
  process.exit(1);
}

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
  concurrency: 5,
  interval: 60_000,
  intervalCap: 45,
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

async function getStarredRepos(username) {
  try {
    return await octokit.paginate(octokit.activity.listReposStarredByUser, {
      username,
      per_page: 100,
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

// A standard HTML-escape function using a replacement map.
function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<>"'{}]/g, (match) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
      "{": "&#123;",
      "}": "&#125;",
    };
    return map[match];
  });
}

function generateHTML(data) {
  // Build the HTML for repository cards grouped by language.
  const reposHTML = data
    .map((langGroup) => {
      const reposCards = langGroup.repos
        .map((repo) => {
          const languagesHTML =
            repo.languages
              .map((l) => `${l.language} (${l.percentage})`)
              .join(", ") || "N/A";
          const topicsHTML = repo.topics.join(", ") || "None";
          return `
        <div class="repo-card">
          <h3><a href="${repo.url}" target="_blank">${escapeHtml(repo.name)}</a></h3>
          <p><strong>Author:</strong> ${escapeHtml(repo.author)}</p>
          <p><strong>Description:</strong> ${escapeHtml(repo.description)}</p>
          <div class="metrics">
            <div class="metric">
              <i class="fa fa-star"></i> ${repo.stars}
            </div>
            <div class="metric">
              <i class="fa fa-code-branch"></i> ${repo.forks}
            </div>
            <div class="metric">
              <i class="fa fa-bug"></i> ${repo.open_issues}
            </div>
            <div class="metric">
              <i class="fa fa-calendar"></i> ${repo.last_updated}
            </div>
          </div>
          <div class="languages">${escapeHtml(languagesHTML)}</div>
          <div class="topics">${escapeHtml(topicsHTML)}</div>
        </div>
      `;
        })
        .join("");
      return `<h2>${escapeHtml(langGroup.language)}</h2>${reposCards}`;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Starred Repositories</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="main.css">
      </head>
      <body>
        <h1>Your Starred Repositories</h1>
        <div class="filters">
          <input type="text" id="searchInput" placeholder="Search..." onkeyup="searchRepositories()">
          <select id="minStars">
            <option value="0">All</option>
            <option value="100">100+</option>
            <option value="500">500+</option>
            <option value="1000">1k+</option>
          </select>
          <select id="languageFilter">
            <option value="All">All</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            ${data
              .map(
                (langGroup) => `
                          <option value="${escapeHtml(langGroup.language)}">${escapeHtml(langGroup.language)}</option>
                        `,
              )
              .join("")}
          </select>
          <select id="sortBy">
            <option value="stars">Stars</option>
            <option value="date">Date Starred</option>
            <option value="name">Name</option>
          </select>
          <button onclick="applyFilters()">Apply Filters</button>
          <button onclick="toggleView()">Switch View</button>
        </div>
        <div id="reposContainer">${reposHTML}</div>
        <script>
          const originalData = ${JSON.stringify(data)};
          let filteredData = originalData;
          let currentView = 'cards';

          function escapeHtml(unsafe) {
            return String(unsafe).replace(/[&<>"'{}]/g, function(match) {
              const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
                "{": "&#123;",
                "}": "&#125;"
              };
              return map[match];
            });
          }

          function searchRepositories() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            if (query.length < 3) return;
            filteredData = originalData.map(group => ({
              ...group,
              repos: group.repos.filter(repo =>
                repo.name.toLowerCase().includes(query) ||
                repo.description.toLowerCase().includes(query)
              )
            })).filter(group => group.repos.length > 0);
            updateView(filteredData);
          }

          function applyFilters() {
            const minStars = parseInt(document.getElementById('minStars').value);
            const selectedLanguage = document.getElementById('languageFilter').value;
            const sortBy = document.getElementById('sortBy').value;

            filteredData = originalData.map(group => ({
              ...group,
              repos: group.repos.filter(repo =>
                repo.stars >= minStars &&
                (selectedLanguage === 'All Languages' || group.language === selectedLanguage)
              )
            })).filter(group => group.repos.length > 0);

            if (sortBy === 'stars') {
              filteredData.forEach(g => g.repos.sort((a, b) => b.stars - a.stars));
            } else if (sortBy === 'date') {
              filteredData.forEach(g => g.repos.sort((a, b) => new Date(b.date) - new Date(a.date)));
            } else {
              filteredData.forEach(g => g.repos.sort((a, b) => a.name.localeCompare(b.name)));
            }

            updateView(filteredData);
          }

          function updateView(data) {
            document.getElementById('reposContainer').innerHTML =
              currentView === 'table' ? generateTableView(data) : generateCardsView(data);
          }

          function generateCardsView(data) {
            return data.map(langGroup => \`
              <h2>\${escapeHtml(langGroup.language)}</h2>
              \${langGroup.repos.map(repo => \`
                <div class="repo-card">
                  <h3><a href="\${repo.url}" target="_blank">\${escapeHtml(repo.name)}</a></h3>
                  <p><strong>Author:</strong> \${escapeHtml(repo.author)}</p>
                  <p><strong>Description:</strong> \${escapeHtml(repo.description)}</p>
                  <div class="metrics">
                    <div class="metric">
                      <i class="fa fa-star"></i> \${repo.stars}
                    </div>
                    <div class="metric">
                      <i class="fa fa-code-branch"></i> \${repo.forks}
                    </div>
                    <div class="metric">
                      <i class="fa fa-bug"></i> \${repo.open_issues}
                    </div>
                    <div class="metric">
                      <i class="fa fa-calendar"></i> \${repo.last_updated}
                    </div>
                  </div>
                  <div class="languages">\${escapeHtml(repo.languages.map(l => \`\${l.language} (\${l.percentage})\`).join(', ') || 'N/A')}</div>
                  <div class="topics">\${escapeHtml(repo.topics.join(', ') || 'None')}</div>
                </div>
              \`).join('')
            \`).join('');
          }

          function generateTableView(data) {
            return \`
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Author</th>
                    <th>Description</th>
                    <th>Languages</th>
                    <th>Topics</th>
                    <th>Stars</th>
                    <th>Forks</th>
                    <th>Open Issues</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  \${data.flatMap(group => group.repos).map(repo => \`
                    <tr>
                      <td>\${escapeHtml(repo.name)}</td>
                      <td>\${escapeHtml(repo.author)}</td>
                      <td>\${escapeHtml(repo.description)}</td>
                      <td>\${escapeHtml(repo.languages.map(l => \`\${l.language} (\${l.percentage})\`).join(', ') || 'N/A')}</td>
                      <td>\${escapeHtml(repo.topics.join(', ') || 'None')}</td>
                      <td>\${repo.stars}</td>
                      <td>\${repo.forks}</td>
                      <td>\${repo.open_issues}</td>
                      <td>\${repo.last_updated}</td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            \`;
          }

          function toggleView() {
            currentView = currentView === 'cards' ? 'table' : 'cards';
            updateView(filteredData);
          }
        </script>
      </body>
    </html>
  `;
}

async function generate() {
  try {
    console.log("Fetching starred repositories...");
    const starredRepos = await getStarredRepos(USERNAME);
    console.log(`Fetched ${starredRepos.length} repositories.`);

    console.log("Processing repository data...");
    const transformedData = await transformData(starredRepos);
    saveLanguageCache();

    // Flatten the transformed data for the frontend
    const flattenedData = transformedData.flatMap(
      (langGroup) => langGroup.repos || [],
    );
    console.log(
      `Processed ${flattenedData.length} repositories into flat array.`,
    );

    console.log("Generating HTML...");
    const htmlContent = generateHTML(transformedData);

    console.log("Writing files...");
    fs.writeFileSync("index.html", htmlContent);
    fs.writeFileSync("data.json", JSON.stringify(transformedData, null, 2));

    if (!fs.existsSync("public")) {
      fs.mkdirSync("public");
    }
    fs.writeFileSync("public/index.html", htmlContent);
    fs.writeFileSync(
      "public/data.json",
      JSON.stringify(transformedData, null, 2),
    );
    fs.copyFileSync("main.js", "public/main.js");
    fs.copyFileSync("main.css", "public/main.css");
    if (!fs.existsSync("public/src")) {
      fs.mkdirSync("public/src", { recursive: true });
    }
    fs.cpSync("src/css", "public/src/css", { recursive: true });

    // Save flattened data.json to the frontend directory for Vite dev server
    console.log("Saving flattened data.json to frontend directory...");
    if (!fs.existsSync("src/frontend")) {
      fs.mkdirSync("src/frontend", { recursive: true });
    }
    fs.writeFileSync(
      "src/frontend/data.json",
      JSON.stringify(flattenedData, null, 2),
    );
    console.log("Files saved to root and public directory");
  } catch (error) {
    console.error("Error during generation:", error);
  }
}

generate();

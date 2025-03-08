import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.USERNAME;

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
    const response = await fetch(
      `https://api.github.com/users/${username}/starred?per_page=100&page=${page}`,
      { headers },
    );

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    const data = await response.json();
    repos = repos.concat(data);

    const linkHeader = response.headers.get("Link");
    hasMore = linkHeader?.includes('rel="next"');
    page++;
  }
  return repos;
}

async function getRepoLanguages(languagesUrl, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const response = await fetch(languagesUrl, { headers });
  const data = await response.json();
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return Object.entries(data).map(([lang, bytes]) => ({
    language: lang,
    percentage: total > 0 ? ((bytes / total) * 100).toFixed(1) + "%" : "0%",
  }));
}

async function fetchReposData(username) {
  const starredRepos = await getStarredRepos(username, GITHUB_TOKEN);

  return await Promise.all(
    starredRepos.map(async (starredRepo) => {
      const repo = starredRepo;
      const languages = await getRepoLanguages(
        repo.languages_url,
        GITHUB_TOKEN,
      );

      return {
        name: repo.name,
        description: repo.description || "No description",
        author: repo.owner.login,
        stars: repo.stargazers_count,
        url: repo.html_url,
        date: new Date(repo.starred_at).toLocaleDateString(),
        languages,
        topics: repo.topics || [],
        license: repo.license?.name || "None",
        forks: repo.forks_count,
        open_issues: repo.open_issues_count,
        last_updated: new Date(repo.pushed_at).toLocaleDateString(),
      };
    }),
  );
}

async function main() {
  const username = "KBLLR";
  const reposData = await fetchReposData(username);
  fs.writeFileSync("reposData.json", JSON.stringify(reposData, null, 2));
  console.log("Data fetched successfully!");
}

main().catch(console.error);

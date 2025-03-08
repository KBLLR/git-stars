<<<<<<< HEAD
const container = document.getElementById('reposContainer');
const searchInput = document.getElementById('searchInput');
const languageFilter = document.getElementById('languageFilter');
const tagFilter = document.getElementById('tagFilter');
const sortBy = document.getElementById('sortBy');
const errorMessage = document.getElementById('errorMessage');

const summarizeIcon = document.getElementById('summarizeIcon');
const tagIcon = document.getElementById('tagIcon');
const rateIcon = document.getElementById('rateIcon');
const logsIcon = document.getElementById('logsIcon');

const repoCountBadge = document.getElementById('repoCountBadge');
const logsCountBadge = document.getElementById('logsCountBadge');
const logBadge = document.getElementById('logCount');

// Escape HTML to avoid injecting markup
function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<>"'{}]/g, match => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '{': '&#123;',
      '}': '&#125;',
    };
    return map[match];
  });
}

let repos = [];
let languages = new Set();
let tags = new Set();

fetch('data.json')
  .then(r => {
    if (!r.ok) {
      throw new Error('Network response was not ok');
    }
    return r.json();
  })
  .then(data => {
    repos = data;

    if (repoCountBadge) repoCountBadge.textContent = repos.length;

    updateLogCount();

    repos.forEach(r => {
      (r.languages || []).forEach(l => languages.add(l.language));
      (r.topics || []).forEach(t => tags.add(t));
    });

    populateFilters();
    render();
  })
  .catch(err => {
    console.error('Failed to load repository data:', err);
    if (errorMessage) {
      errorMessage.textContent = 'Failed to load data. Please try again later.';
    }
  });

function populateFilters() {
  languageFilter.innerHTML = '<option value="all">All Languages</option>' +
    Array.from(languages)
      .sort()
      .map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
      .join('');
  tagFilter.innerHTML = '<option value="all">All Tags</option>' +
    Array.from(tags)
      .sort()
      .map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
      .join('');
}

function render() {
  const search = searchInput.value.toLowerCase();
  const lang = languageFilter.value;
  const tag = tagFilter.value;

  let filtered = repos.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search) || (r.description || '').toLowerCase().includes(search);
    const matchLang = lang === 'all' || (r.languages || []).some(l => l.language === lang);
    const matchTag = tag === 'all' || (r.topics || []).includes(tag);
    return matchSearch && matchLang && matchTag;
  });

  const sortValue = sortBy.value;
  filtered.sort((a, b) => {
    switch (sortValue) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'created':
        return new Date(b.last_updated) - new Date(a.last_updated);
      case 'language': {
        const la = (a.languages && a.languages[0] ? a.languages[0].language : '');
        const lb = (b.languages && b.languages[0] ? b.languages[0].language : '');
        return la.localeCompare(lb);
      }
      case 'tag': {
        const ta = (a.topics && a.topics[0]) || '';
        const tb = (b.topics && b.topics[0]) || '';
        return ta.localeCompare(tb);
      }
      default:
        return 0;
    }
  });

  container.innerHTML = filtered.map(repo => repoCard(repo)).join('');
}

function repoCard(repo) {
  const langs = (repo.languages || []).map(l => `${l.language}`).join(', ');
  const topics = (repo.topics || []).join(', ');
  return `<div class="repo-card">
    <h3><a href="${repo.url}" target="_blank">${escapeHtml(repo.name)}</a></h3>
    <p><strong>Author:</strong> ${escapeHtml(repo.author)}</p>
    <p><strong>Description:</strong> ${escapeHtml(repo.description)}</p>
    <div class="metrics">
      <div class="metric"><i class="fa fa-star" title="Stars"></i> ${repo.stars}</div>
      <div class="metric"><i class="fa fa-code-branch" title="Forks"></i> ${repo.forks}</div>
      <div class="metric"><i class="fa fa-bug" title="Open Issues"></i> ${repo.open_issues}</div>
      <div class="metric"><i class="fa fa-calendar" title="Last Updated"></i> ${repo.last_updated}</div>
    </div>
    <div class="languages">${langs}</div>
    <div class="topics">${escapeHtml(topics) || 'None'}</div>
  </div>`;
}

searchInput.addEventListener('input', render);
languageFilter.addEventListener('change', render);
tagFilter.addEventListener('change', render);
sortBy.addEventListener('change', render);

// Unified logging function
function logAction(type, details, tags = '', rating = '') {
  const logs = JSON.parse(localStorage.getItem('actionLogs') || '[]');
  logs.push({ time: new Date().toISOString(), type, details, tags, rating });
  localStorage.setItem('actionLogs', JSON.stringify(logs));
  updateLogCount();
}

function updateLogCount() {
  const logs = JSON.parse(localStorage.getItem('actionLogs') || '[]');
  if (logsCountBadge) logsCountBadge.textContent = logs.length;
  if (logBadge) logBadge.textContent = logs.length;
}

// Event handlers
document.getElementById('action-statistics')?.addEventListener('click', () => {
  alert('Statistics action triggered');
  logAction('Statistics', 'graphs');
});
document.getElementById('action-notebook')?.addEventListener('click', () => {
  alert('Notebook action triggered');
  logAction('Notebook LLM', 'blog');
});
document.getElementById('action-chat')?.addEventListener('click', () => {
  alert('Chat action triggered');
  logAction('Chat Gemini', 'chat');
});
document.getElementById('action-news')?.addEventListener('click', () => {
  alert('News Feed action triggered');
  logAction('News Feed', 'news');
});

summarizeIcon?.addEventListener('click', () => {
  alert('Summarizing repository...');
  logAction('summarize', 'repo');
});
tagIcon?.addEventListener('click', () => {
  alert('Generating tags...');
  logAction('tag', 'repo', 'example');
});
rateIcon?.addEventListener('click', () => {
  alert('Rating repository...');
  const rating = Math.floor(Math.random() * 5) + 1;
  logAction('rate', 'repo', '', rating);
});
logsIcon?.addEventListener('click', () => {
  logAction('open-logs', 'page');
});
=======
document.addEventListener("DOMContentLoaded", async () => {
  let originalData = null;
  let filteredData = null;
  let githubSearchResults = [];

  // Fetch and initialize data
  async function fetchData() {
    try {
      const response = await fetch("data.json");
      const data = await response.json();
      originalData = data.repos;
      filteredData = originalData;
      setupFilters();
      setupSearch();
      updateDisplay(filteredData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  // Setup filters
  function setupFilters() {
    setupLanguageFilter();
    setupStarsFilter();
    setupTopicFilter();
    setupSorting();
  }

  function setupLanguageFilter() {
    const languageFilter = document.getElementById("languageFilter");
    const languages = new Set(originalData.map((repo) => repo.language));

    languageFilter.innerHTML = `<option value="all">All Languages</option>`;
    languages.forEach((language) => {
      if (language) {
        const option = document.createElement("option");
        option.value = language;
        option.textContent = language;
        languageFilter.appendChild(option);
      }
    });

    languageFilter.addEventListener("change", applyFilters);
  }

  function setupStarsFilter() {
    document
      .getElementById("starsFilter")
      .addEventListener("input", applyFilters);
  }

  function setupTopicFilter() {
    const topicContainer = document.getElementById("topicContainer");
    const topicCheckboxes = topicContainer.querySelectorAll(".topic-checkbox");

    topicCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", applyFilters);
    });
  }

  function setupSorting() {
    document.getElementById("sortBy").addEventListener("change", applyFilters);
  }

  function setupSearch() {
    document
      .getElementById("searchInput")
      .addEventListener("input", debounce(applyFilters, 300));
    document
      .getElementById("githubSearchBtn")
      .addEventListener("click", performGithubSearch);
  }

  function applyFilters() {
    const language = document.getElementById("languageFilter").value;
    const minStars =
      parseInt(document.getElementById("starsFilter").value) || 0;
    const searchQuery = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const selectedTopics = Array.from(
      document.querySelectorAll(".topic-checkbox:checked"),
    ).map((checkbox) => checkbox.value);

    filteredData = originalData.filter((repo) => {
      const matchesLanguage = language === "all" || repo.language === language;
      const matchesStars = repo.stars >= minStars;
      const matchesSearch =
        repo.name.toLowerCase().includes(searchQuery) ||
        repo.description.toLowerCase().includes(searchQuery);
      const matchesTopics =
        selectedTopics.length === 0 ||
        selectedTopics.some((topic) => repo.topics.includes(topic));

      return matchesLanguage && matchesStars && matchesSearch && matchesTopics;
    });

    applySorting();
    updateDisplay(filteredData);

    // If no results found, suggest GitHub global search
    if (filteredData.length === 0 && searchQuery.length > 2) {
      document.getElementById("githubSearchPrompt").style.display = "block";
    } else {
      document.getElementById("githubSearchPrompt").style.display = "none";
    }
  }

  function applySorting() {
    const sortBy = document.getElementById("sortBy").value;

    filteredData.sort((a, b) => {
      if (sortBy === "stars-desc") return b.stars - a.stars;
      if (sortBy === "stars-asc") return a.stars - b.stars;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "updated-desc")
        return new Date(b.last_updated) - new Date(a.last_updated);
      if (sortBy === "updated-asc")
        return new Date(a.last_updated) - new Date(b.last_updated);
      return 0;
    });
  }

  function updateDisplay(data) {
    const container = document.getElementById("reposContainer");
    container.innerHTML = data
      .map(
        (repo) => `
                <div class="repo-card">
                    <h3><a href="${repo.url}" target="_blank">${repo.name}</a></h3>
                    <p>${repo.description}</p>
                    <p><strong>Stars:</strong> ${repo.stars}</p>
                    <p><strong>Language:</strong> ${repo.language}</p>
                    <p><strong>Topics:</strong> ${repo.topics.join(", ") || "None"}</p>
                </div>
            `,
      )
      .join("");
  }

  // Perform GitHub Global Search
  async function performGithubSearch() {
    const searchQuery = document.getElementById("searchInput").value.trim();
    if (!searchQuery) return;

    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer YOUR_GITHUB_TOKEN`, // Replace with a valid GitHub token
        },
      });
      const data = await response.json();
      githubSearchResults = data.items || [];
      displayGithubResults();
    } catch (error) {
      console.error("GitHub Search Failed:", error);
    }
  }

  // Display GitHub Search Results
  function displayGithubResults() {
    const container = document.getElementById("githubResultsContainer");
    container.innerHTML = githubSearchResults
      .map(
        (repo) => `
                <div class="repo-card github-result">
                    <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                    <p>${repo.description}</p>
                    <p><strong>Stars:</strong> ${repo.stargazers_count}</p>
                    <p><strong>Language:</strong> ${repo.language || "Unknown"}</p>
                </div>
            `,
      )
      .join("");
  }

  // Toggle grid/list view
  document.getElementById("toggleView").addEventListener("click", () => {
    document.getElementById("reposContainer").classList.toggle("list-view");
  });

  // Toggle dark mode
  document.getElementById("darkModeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  setInterval(fetchData, 300000);
  fetchData();
});

// Debounce function
function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, arguments), delay);
  };
}
>>>>>>> c35a3ee (Included new generator)

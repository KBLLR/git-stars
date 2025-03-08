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

document.addEventListener("DOMContentLoaded", async () => {
  let originalData = [];

  const searchInput = document.getElementById("searchInput");
  const languageFilter = document.getElementById("languageFilter");
  const starsFilter = document.getElementById("starsFilter");
  const sortBy = document.getElementById("sortBy");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const toggleView = document.getElementById("toggleView");
  const reposContainer = document.getElementById("reposContainer");

  let currentView = "grid"; // Possible views: grid, list, graph

  // Fetch JSON data
  async function fetchData() {
    try {
      const response = await fetch("data.json");
      const data = await response.json();
      originalData = data.repos;
      populateFilters(originalData);
      updateDisplay(originalData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  // Populate language filter options
  function populateFilters(data) {
    const languages = [
      ...new Set(data.map((repo) => repo.language).filter(Boolean)),
    ];
    languages.forEach((lang) => {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = lang;
      languageFilter.appendChild(option);
    });
  }

  // Apply filters and sorting
  function applyFilters() {
    let filteredData = [...originalData];

    const searchQuery = searchInput.value.toLowerCase();
    const selectedLanguage = languageFilter.value;
    const minStars = parseInt(starsFilter.value) || 0;
    const sortValue = sortBy.value;

    if (searchQuery) {
      filteredData = filteredData.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery),
      );
    }

    if (selectedLanguage !== "all") {
      filteredData = filteredData.filter(
        (repo) => repo.language === selectedLanguage,
      );
    }

    filteredData = filteredData.filter((repo) => repo.stars >= minStars);

    switch (sortValue) {
      case "stars-desc":
        filteredData.sort((a, b) => b.stars - a.stars);
        break;
      case "stars-asc":
        filteredData.sort((a, b) => a.stars - b.stars);
        break;
      case "name-asc":
        filteredData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filteredData.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "updated-desc":
        filteredData.sort(
          (a, b) => new Date(b.last_updated) - new Date(a.last_updated),
        );
        break;
      case "updated-asc":
        filteredData.sort(
          (a, b) => new Date(a.last_updated) - new Date(b.last_updated),
        );
        break;
    }

    updateDisplay(filteredData);
  }

  // Update display with repositories
  function updateDisplay(data) {
    if (currentView === "graph") {
      renderGraphView(data);
      return;
    }

    const reposContainer = document.getElementById("reposContainer");
    reposContainer.innerHTML = data
      .map(
        (repo) => `
          <div class="repo-card">
            <h3><a href="${repo.url}" target="_blank">${repo.name} <i class="fas fa-external-link-alt"></i></a></h3>
            <p>${repo.description}</p>
            <p><i class="fas fa-star"></i> <strong>Stars:</strong> ${repo.stars}</p>
            <p><i class="fas fa-code"></i> <strong>Language:</strong> ${repo.language}</p>
            <p><i class="fas fa-tags"></i> <strong>Topics:</strong> ${repo.topics.join(", ") || "None"}</p>
            <p><i class="fas fa-scroll"></i> <strong>License:</strong> ${repo.license}</p>
            <p><i class="fas fa-clock"></i> <strong>Last Updated:</strong> ${new Date(repo.last_updated).toLocaleDateString()}</p>
          </div>
        `,
      )
      .join("");
  }

  // Toggle dark mode
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  // Toggle view mode
  toggleView.addEventListener("click", () => {
    if (currentView === "grid") {
      reposContainer.classList.add("list-view");
      currentView = "list";
    } else if (currentView === "list") {
      currentView = "graph";
      reposContainer.style.display = "none";
      document.getElementById("graphView").style.display = "block";
      renderGraphView();
    } else {
      document.getElementById("graphView").style.display = "none";
      reposContainer.style.display = "grid";
      reposContainer.classList.toggle("list-view");
      currentView = reposContainer.classList.contains("list-view")
        ? "list"
        : "grid";
    }
  });

  // Render graph view
  function renderGraphView(data = originalData) {
    // Implement your graph visualization logic here, using p5.js or another library.
    reposContainer.style.display = "none";
    document.getElementById("graphView").style.display = "block";
    // Example: Initialize p5.js and render graph
  }

  // Event listeners for filters
  searchInput.addEventListener("input", applyFilters);
  languageFilter.addEventListener("change", applyFilters);
  starsFilter.addEventListener("input", applyFilters);
  sortBy.addEventListener("change", applyFilters);

  fetchData();
});

import { marked } from "marked";

// Add version info for troubleshooting
const APP_VERSION = "1.0.2";
console.log(`Git Stars App v${APP_VERSION}`);

// Initialize application elements
const container = document.getElementById("reposContainer");
const searchInput = document.getElementById("searchInput");
const languageFilter = document.getElementById("languageFilter");
const tagFilter = document.getElementById("tagFilter");
const licenseFilter = document.getElementById("licenseFilter");
const sortBy = document.getElementById("sortBy");
const errorMessage = document.getElementById("errorMessage");
const summarizeIcon = document.getElementById("summarizeIcon");
const tagIcon = document.getElementById("tagIcon");
const rateIcon = document.getElementById("rateIcon");
const logsIcon = document.getElementById("logsIcon");
const starCountBadge = document.getElementById("starCount");
const logsCountBadge =
  document.getElementById("logsCountBadge") || document.getElementById("logCount");
const logTypeFilter = document.getElementById("logTypeFilter");
const recentLogsList = document.getElementById("recentLogs");
const exportLogsBtn = document.getElementById("exportLogsBtn");
const cardStyleSelect = document.getElementById("cardStyle");

// Initialize repository count to 0
if (starCountBadge) starCountBadge.textContent = "0";

const readmePanel = document.getElementById("readmePanel");
const readmeContent = document.getElementById("readmeContent");
const closePanel = document.getElementById("closePanel");

// Escape HTML to avoid injecting markup
function escapeHtml(unsafe) {
  return String(unsafe).replace(
    /[&<>"'{}]/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
        "{": "&#123;",
        "}": "&#125;",
      })[match],
  );
}

let repos = [],
  languages = new Set(),
  tags = new Set(),
  licenses = new Set();

// Try multiple possible paths for data.json
const tryFetchPaths = (paths, index = 0) => {
  if (index >= paths.length) {
    console.error("Data load failed: All paths tried");
    if (errorMessage) {
      errorMessage.innerHTML = `
        <div class="error-details">
          <h3>Failed to load data</h3>
          <p>Could not find data.json in any of these locations:</p>
          <ul>${paths.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
          <p>Try running <code>npm run build:data</code> to generate the data file.</p>
        </div>
      `;
    }
    return Promise.reject("All paths failed");
  }

  console.log(`Trying to fetch from: ${paths[index]}`);
  return fetch(paths[index])
    .then((r) => {
      if (r.ok) {
        console.log(`Successfully loaded data from: ${paths[index]}`);
        return r.json().then((data) => {
          console.log(
            `Data structure:`,
            data.length > 0
              ? data[0].repos
                ? "Language groups"
                : "Flat repos"
              : "Empty array",
          );
          return data;
        });
      }
      console.warn(`Failed to load from ${paths[index]}, status: ${r.status}`);
      return tryFetchPaths(paths, index + 1);
    })
    .catch((err) => {
      console.error(`Error fetching from ${paths[index]}:`, err);
      return tryFetchPaths(paths, index + 1);
    });
};

// Add a diagnostic mode that can be enabled with ?debug=true in the URL
const debugMode =
  new URLSearchParams(window.location.search).get("debug") === "true";
if (debugMode) {
  console.log("Debug mode enabled");
  document.body.classList.add("debug-mode");
}

// Try different paths based on where data.json might be
tryFetchPaths([
  "./data.json",
  "/data.json",
  "../data.json",
  "../public/data.json",
  "../../public/data.json",
  "/git-stars/data.json", // For GitHub Pages deployment
])
  .then((data) => {
    // Check if data is an array of language groups (each with repos property)
    if (Array.isArray(data) && data.length > 0 && data[0].repos) {
      // Flatten the array of language groups into a flat array of repos
      repos = data.flatMap((langGroup) => langGroup.repos || []);
    } else {
      // If it's already a flat array, use it directly
      repos = data;
    }

    // Update repo counter with animation
    if (starCountBadge) {
      starCountBadge.classList.add("highlight-count");
      starCountBadge.textContent = repos.length.toLocaleString();
      setTimeout(
        () => starCountBadge.classList.remove("highlight-count"),
        1000,
      );
    }
    updateLogCount();

    // Gather all unique languages, topics, and licenses
    repos.forEach((r) => {
      (r.languages || []).forEach((l) => languages.add(l.language));
      (r.topics || []).forEach((t) => tags.add(t));
      if (r.license) licenses.add(r.license);
    });

    populateFilters();
    render();

    // Log repo count for debugging
    console.log(`Loaded ${repos.length} repositories`);
  })
  .catch((err) => {
    console.error("Data load failed:", err);

    // If error message element exists and it hasn't been set by tryFetchPaths
    if (errorMessage && !errorMessage.innerHTML.includes("error-details")) {
      // Show basic error for regular users or detailed for debug mode
      if (debugMode) {
        errorMessage.innerHTML = `
          <div class="error-details">
            <h3>Data Load Error</h3>
            <p>Error: ${escapeHtml(err.toString())}</p>
            <p>Application Environment:</p>
            <ul>
              <li>URL: ${escapeHtml(window.location.href)}</li>
              <li>Browser: ${escapeHtml(navigator.userAgent)}</li>
              <li>Time: ${new Date().toISOString()}</li>
            </ul>
            <button id="retryButton" class="retry-btn">Retry</button>
          </div>
        `;
        document
          .getElementById("retryButton")
          ?.addEventListener("click", () => {
            window.location.reload();
          });
      } else {
        errorMessage.innerHTML = `
          <div class="error-message">
            <p>Failed to load repository data. <button id="retryButton" class="retry-btn">Retry</button></p>
          </div>
        `;
        document
          .getElementById("retryButton")
          ?.addEventListener("click", () => {
            window.location.reload();
          });
      }
    }
  });

function populateFilters() {
  languageFilter.innerHTML =
    '<option value="all">All Languages</option>' +
    [...languages]
      .sort()
      .map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
      .join("");
  tagFilter.innerHTML =
    '<option value="all">All Tags</option>' +
    [...tags]
      .sort()
      .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
      .join("");
  licenseFilter.innerHTML =
    '<option value="all">All Licenses</option>' +
    [...licenses]
      .sort()
      .map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)
      .join("");
}

const getCardStyle = () => cardStyleSelect?.value || "default";

function safeNumber(value, fallback = "0") {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString();
  }
  if (typeof value === "string" && value.trim().length) {
    return escapeHtml(value);
  }
  return fallback;
}

function chipList(items, { emptyLabel, className }) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<span class="${className} ${className}--empty">${escapeHtml(emptyLabel)}</span>`;
  }
  return items
    .map((item) => `<span class="${className}">${escapeHtml(String(item))}</span>`)
    .join("");
}

function languageList(languages) {
  if (!Array.isArray(languages) || languages.length === 0) {
    return '<span class="language-item language-item--empty">Languages unavailable</span>';
  }

  return languages
    .map((entry) => {
      const lang = entry?.language ? escapeHtml(entry.language) : "Unknown";
      const percentage = entry?.percentage
        ? ` <span class="language-percent">${escapeHtml(entry.percentage)}</span>`
        : "";
      return `<span class="language-item">${lang}${percentage}</span>`;
    })
    .join("");
}

function render() {
  const search = searchInput.value.toLowerCase();
  const lang = languageFilter.value;
  const tag = tagFilter.value;
  const lic = licenseFilter.value;
  const style = getCardStyle();

  const filtered = repos
    .filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search) ||
        (r.description || "").toLowerCase().includes(search);
      const matchLang =
        lang === "all" || (r.languages || []).some((l) => l.language === lang);
      const matchTag = tag === "all" || (r.topics || []).includes(tag);
      const matchLic = lic === "all" || r.license === lic;
      return matchSearch && matchLang && matchTag && matchLic;
    })
    .sort((a, b) => {
      switch (sortBy.value) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.date) - new Date(a.date);
        case "created":
          return new Date(b.last_updated) - new Date(a.last_updated);
        case "language":
          return (a.languages?.[0]?.language || "").localeCompare(
            b.languages?.[0]?.language || "",
          );
        case "tag":
          return (a.topics?.[0] || "").localeCompare(b.topics?.[0] || "");
        default:
          return 0;
      }
    });

  container.innerHTML = filtered.map((repo) => repoCard(repo, style)).join("");
}

function baseCard(repo, style) {
  const primaryLanguage =
    repo.primary_language || repo.languages?.[0]?.language || "Unknown";
  const topicsMarkup = chipList(repo.topics, {
    emptyLabel: "No topics yet",
    className: "topic",
  });
  const licenseLabel =
    repo.license && repo.license !== "None" ? repo.license : "No license";

  return `<article class="repo-card" data-author="${escapeHtml(
    repo.author || "unknown",
  )}" data-repo="${escapeHtml(repo.name)}" data-card-style="${escapeHtml(
    style,
  )}">
    <h3><a href="${repo.url}" target="_blank">${escapeHtml(repo.name)}</a></h3>
    <p class="description">${escapeHtml(
      repo.description || "No description provided",
    )}</p>
    <div class="details" aria-label="Repository details">
      <span class="detail-item"><i class="fa fa-user"></i>${escapeHtml(
        repo.author || "Unknown author",
      )}</span>
      <span class="detail-item"><i class="fa fa-code"></i>${escapeHtml(
        primaryLanguage,
      )}</span>
      <span class="detail-item"><i class="fa fa-id-badge"></i>${escapeHtml(
        licenseLabel,
      )}</span>
    </div>
    <div class="metrics" aria-label="Repository metrics">
      <div class="metric"><i class="fa fa-star"></i> ${safeNumber(
        repo.stars,
      )}</div>
      <div class="metric"><i class="fa fa-code-branch"></i> ${safeNumber(
        repo.forks,
      )}</div>
      <div class="metric"><i class="fa fa-bug"></i> ${safeNumber(
        repo.open_issues,
      )}</div>
      <div class="metric"><i class="fa fa-calendar"></i> ${escapeHtml(
        repo.last_updated || "Unknown",
      )}</div>
    </div>
    <div class="languages" aria-label="Languages">${languageList(
      repo.languages,
    )}</div>
    <div class="topics" aria-label="Topics">${topicsMarkup}</div>
    <div class="date">Starred on: ${escapeHtml(repo.date || "Unknown")}</div>
  </article>`;
}

function professionalCard(repo, style) {
  const topicsMarkup = chipList(repo.topics, {
    emptyLabel: "No topics yet",
    className: "topic",
  });
  const languagesMarkup = languageList(repo.languages);
  const primaryLanguage =
    repo.primary_language || repo.languages?.[0]?.language || "Unknown";
  const licenseLabel =
    repo.license && repo.license !== "None" ? repo.license : "No license";

  return `<article class="repo-card repo-card--professional" data-author="${escapeHtml(
    repo.author || "unknown",
  )}" data-repo="${escapeHtml(repo.name)}" data-card-style="${escapeHtml(
    style,
  )}">
    <aside class="sidebar">
      <div class="stars" title="GitHub stars">
        <i class="fa fa-star"></i> ${safeNumber(repo.stars)}
      </div>
      <div class="language" title="Primary language">${escapeHtml(
        primaryLanguage,
      )}</div>
    </aside>
    <div class="content">
      <h3><a href="${repo.url}" target="_blank">${escapeHtml(
        repo.name,
      )}</a></h3>
      <p class="description">${escapeHtml(
        repo.description || "No description provided",
      )}</p>
      <div class="details" aria-label="Repository details">
        <span class="detail-item"><i class="fa fa-user"></i>${escapeHtml(
          repo.author || "Unknown author",
        )}</span>
        <span class="detail-item"><i class="fa fa-id-badge"></i>${escapeHtml(
          licenseLabel,
        )}</span>
        <span class="detail-item"><i class="fa fa-calendar"></i>${escapeHtml(
          repo.last_updated || "Unknown",
        )}</span>
      </div>
      <div class="languages" aria-label="Languages">${languagesMarkup}</div>
      <div class="topics" aria-label="Topics">${topicsMarkup}</div>
      <div class="date">Starred on: ${escapeHtml(
        repo.date || "Unknown",
      )}</div>
    </div>
  </article>`;
}

function repoCard(repo, style) {
  if (style === "professional") {
    return professionalCard(repo, style);
  }
  return baseCard(repo, style);
}

searchInput.addEventListener("input", render);
languageFilter.addEventListener("change", render);
tagFilter.addEventListener("change", render);
licenseFilter.addEventListener("change", render);
sortBy.addEventListener("change", render);

logTypeFilter?.addEventListener("change", () => {
  renderRecentLogs(getStoredLogs());
});

exportLogsBtn?.addEventListener("click", () => {
  const logs = getStoredLogs();
  if (!logs.length) {
    alert("No activity available to export yet.");
    return;
  }
  exportLogsToJson(logs);
});

refreshActivityView();

function getStoredLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem("actionLogs") || "[]");
    if (!Array.isArray(logs)) {
      return [];
    }
    return logs;
  } catch (e) {
    console.error("Error reading logs:", e);
    if (e instanceof SyntaxError) {
      console.warn("Resetting corrupted logs");
      localStorage.setItem("actionLogs", "[]");
    }
    return [];
  }
}

function populateLogTypes(logs) {
  if (!logTypeFilter) return;

  const currentValue = logTypeFilter.value;
  const uniqueTypes = new Set(["all"]);
  logs.forEach((log) => {
    if (log?.type) uniqueTypes.add(log.type);
  });

  logTypeFilter.innerHTML = Array.from(uniqueTypes)
    .sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return a.localeCompare(b);
    })
    .map(
      (type) =>
        `<option value="${type}">${
          type === "all" ? "All actions" : escapeHtml(type)
        }</option>`,
    )
    .join("");

  if (uniqueTypes.has(currentValue)) {
    logTypeFilter.value = currentValue;
  }
}

function renderRecentLogs(logs) {
  if (!recentLogsList) return;

  const selectedType = logTypeFilter ? logTypeFilter.value : "all";
  const filtered = logs.filter((log) => {
    if (!log || typeof log !== "object") return false;
    if (selectedType && selectedType !== "all" && log.type !== selectedType) {
      return false;
    }
    return true;
  });

  const latest = filtered.slice(0, 6);

  if (!latest.length) {
    recentLogsList.innerHTML =
      '<li class="empty">No matching activity yet. Try a different filter.</li>';
    return;
  }

  recentLogsList.innerHTML = latest
    .map((log) => {
      const timestamp = log.time
        ? new Date(log.time).toLocaleString()
        : "Unknown time";
      const details = log.details ? escapeHtml(log.details) : "No details provided";
      const tags = log.tags
        ? escapeHtml(Array.isArray(log.tags) ? log.tags.join(", ") : log.tags)
        : "—";
      const rating = log.rating ? `⭐ ${escapeHtml(String(log.rating))}` : "";
      return `<li>
        <div class="meta">
          <span>${escapeHtml(log.type || "unknown action")}</span>
          <span>${escapeHtml(timestamp)}</span>
        </div>
        <div>${details}</div>
        <div class="meta">
          <span>${tags}</span>
          <span>${rating}</span>
        </div>
      </li>`;
    })
    .join("");
}

function exportLogsToJson(logs) {
  if (!logs?.length) return;
  const blob = new Blob([JSON.stringify(logs, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "git-stars-activity.json";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function refreshActivityView() {
  const logs = getStoredLogs();
  if (logsCountBadge) logsCountBadge.textContent = logs.length;
  populateLogTypes(logs);
  renderRecentLogs(logs);
  return logs;
}

function logAction(type, details, tags = "", rating = "") {
  try {
    const logs = getStoredLogs();
    const newLog = {
      time: new Date().toISOString(),
      type,
      details,
      tags,
      rating,
      appVersion: APP_VERSION,
    };

    logs.unshift(newLog);

    if (logs.length > 100) {
      logs.length = 100;
    }

    try {
      localStorage.setItem("actionLogs", JSON.stringify(logs));
    } catch (storageError) {
      if (debugMode) {
        console.warn("Storage quota warning while saving logs", storageError);
      }
      logs.length = 50;
      try {
        localStorage.setItem("actionLogs", JSON.stringify(logs));
      } catch (error) {
        if (debugMode) {
          console.error("Failed to persist trimmed logs", error);
        }
        localStorage.setItem("actionLogs", JSON.stringify([newLog]));
      }
    }

    refreshActivityView();

    if (debugMode) {
      console.log("Action logged:", newLog);
    }
  } catch (error) {
    console.error("Error logging action:", error);
  }
}

function updateLogCount() {
  refreshActivityView();
}

// Add a function to clean up storage if needed
function cleanupStorage() {
  try {
    // Try to write a test item to check if localStorage is available
    localStorage.setItem("testStorage", "1");
    localStorage.removeItem("testStorage");

    // Check storage usage
    let totalSize = 0;
    Object.keys(localStorage).forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += (value.length * 2) / 1024; // Approximate KB
      }
    });

    // If using more than ~4MB, clean up logs
    if (totalSize > 4000) {
      const logs = getStoredLogs();
      if (logs.length > 20) {
        logs.length = 20; // Aggressive cleanup
        localStorage.setItem("actionLogs", JSON.stringify(logs));
        console.warn("Storage cleanup performed. Reduced logs to 20 entries.");
        refreshActivityView();
      }
    }
  } catch (e) {
    console.error("Storage error during cleanup:", e);
  }
}

// Function to clear all logs
function clearAllLogs() {
  try {
    localStorage.setItem("actionLogs", "[]");
    refreshActivityView();
    console.log("All logs cleared");

    // Show feedback to user
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = "Logs cleared successfully";
    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.add("toast-hide");
      setTimeout(() => toast.remove(), 500);
    }, 3000);

    return true;
  } catch (e) {
    console.error("Error clearing logs:", e);
    return false;
  }
}

function openReadmePanel(author, repo) {
  if (!readmePanel) return;
  document.body.classList.add("panel-open");
  readmePanel.classList.add("open");
  readmeContent.innerHTML = "Loading...";

  const tryFetch = (branch) =>
    fetch(
      `https://raw.githubusercontent.com/${author}/${repo}/${branch}/README.md`,
    ).then((r) => (r.ok ? r.text() : ""));

  tryFetch("master")
    .then((text) => text || tryFetch("main"))
    .then((text) => {
      readmeContent.innerHTML = text ? marked.parse(text) : "README not found";
    })
    .catch(() => {
      readmeContent.textContent = "Failed to load README";
    });
}

closePanel?.addEventListener("click", () => {
  readmePanel.classList.remove("open");
  document.body.classList.remove("panel-open");
});

container?.addEventListener("click", (e) => {
  const card = e.target.closest(".repo-card");
  if (!card) return;
  const author = card.dataset.author;
  const repo = card.dataset.repo;
  if (author && repo) openReadmePanel(author, repo);
});

document
  .getElementById("action-statistics")
  ?.addEventListener("click", () => logAction("Statistics", "graphs"));
document
  .getElementById("action-notebook")
  ?.addEventListener("click", () => logAction("Notebook LLM", "blog"));
document
  .getElementById("action-chat")
  ?.addEventListener("click", () => logAction("Chat Gemini", "chat"));
document
  .getElementById("action-news")
  ?.addEventListener("click", () => logAction("News Feed", "news"));

summarizeIcon?.addEventListener("click", () => logAction("summarize", "repo"));
tagIcon?.addEventListener("click", () => logAction("tag", "repo", "example"));
rateIcon?.addEventListener("click", () => {
  const rating = Math.floor(Math.random() * 5) + 1;
  logAction("rate", "repo", "", rating);
});
logsIcon?.addEventListener("click", () => logAction("open-logs", "page"));

cardStyleSelect?.addEventListener("change", () => {
  document.body.classList.remove(
    "retro",
    "futuristic",
    "professional",
    "terminal",
    "neumorphic",
    "minimalist",
  );
  const style = cardStyleSelect.value;
  if (style !== "default") document.body.classList.add(style);
  render();
});
cardStyleSelect?.dispatchEvent(new Event("change"));

// Add window error handling
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  if (debugMode) {
    const errorContainer = document.createElement("div");
    errorContainer.className = "runtime-error";
    errorContainer.innerHTML = `
      <h3>Runtime Error</h3>
      <p>${escapeHtml(event.message)}</p>
      <p>Line: ${event.lineno}, Column: ${event.colno}</p>
      <p>Source: ${escapeHtml(event.filename)}</p>
    `;
    document.body.appendChild(errorContainer);
  }
  // Log the error
  logAction("error", event.message || "Unknown runtime error");
});

// Add clear logs button functionality
document.getElementById("clearLogsBtn")?.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent triggering parent links
  if (confirm("Are you sure you want to clear all logs?")) {
    clearAllLogs();
  }
});

// Run storage cleanup before logging
cleanupStorage();

// Health check - log app startup
try {
  logAction(
    "app_start",
    `App v${APP_VERSION} started with ${repos.length} repositories`,
  );
} catch (e) {
  console.warn("Could not log app startup:", e);
}

// Display debug info for repo count in the console
console.info(`GitStars loaded with ${repos.length} repositories`);

// Add styles for repository count animation and toast messages
const style = document.createElement("style");
style.textContent = `
  @keyframes highlight {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); background-color: #3498db; }
    100% { transform: scale(1); }
  }
  .highlight-count {
    animation: highlight 1s ease;
  }

  .toast-message {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(46, 204, 113, 0.9);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: opacity 0.5s, transform 0.5s;
  }

  .toast-hide {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
`;
document.head.appendChild(style);

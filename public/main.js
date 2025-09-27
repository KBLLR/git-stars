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
const cardStyleSelect = document.getElementById('cardStyle');

const starCountBadge = document.getElementById('starCount');
const logsCountBadge = document.getElementById('logsCountBadge') || document.getElementById('logCount');
const logTypeFilter = document.getElementById('logTypeFilter');
const recentLogsList = document.getElementById('recentLogs');
const exportLogsBtn = document.getElementById('exportLogsBtn');

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

    if (starCountBadge) starCountBadge.textContent = repos.length;


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
  return `<div class="repo-card" data-name="${repo.name}" data-author="${repo.author}">
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

logTypeFilter?.addEventListener('change', () => {
  renderRecentLogs(getStoredLogs());
});

exportLogsBtn?.addEventListener('click', () => {
  const logs = getStoredLogs();
  if (!logs.length) {
    alert('No activity available to export yet.');
    return;
  }
  exportLogsToJson(logs);
});

refreshActivityView();

function getStoredLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem('actionLogs') || '[]');
    if (!Array.isArray(logs)) {
      return [];
    }
    return logs;
  } catch (error) {
    console.error('Failed to parse stored logs', error);
    if (error instanceof SyntaxError) {
      localStorage.setItem('actionLogs', '[]');
    }
    return [];
  }
}

function populateLogTypes(logs) {
  if (!logTypeFilter) return;

  const currentValue = logTypeFilter.value;
  const uniqueTypes = new Set(['all']);
  logs.forEach(log => {
    if (log?.type) uniqueTypes.add(log.type);
  });

  logTypeFilter.innerHTML = Array.from(uniqueTypes)
    .sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      return a.localeCompare(b);
    })
    .map(type => `<option value="${type}">${type === 'all' ? 'All actions' : escapeHtml(type)}</option>`)
    .join('');

  if (uniqueTypes.has(currentValue)) {
    logTypeFilter.value = currentValue;
  }
}

function renderRecentLogs(logs) {
  if (!recentLogsList) return;

  const selectedType = logTypeFilter ? logTypeFilter.value : 'all';
  const filtered = logs.filter(log => {
    if (!log || typeof log !== 'object') return false;
    if (selectedType && selectedType !== 'all' && log.type !== selectedType) {
      return false;
    }
    return true;
  });

  const latest = filtered.slice(-6).reverse();

  if (!latest.length) {
    recentLogsList.innerHTML = '<li class="empty">No matching activity yet. Try a different filter.</li>';
    return;
  }

  recentLogsList.innerHTML = latest
    .map(log => {
      const timestamp = log.time ? new Date(log.time).toLocaleString() : 'Unknown time';
      const details = log.details ? escapeHtml(log.details) : 'No details provided';
      const tags = log.tags ? escapeHtml(Array.isArray(log.tags) ? log.tags.join(', ') : log.tags) : '—';
      const rating = log.rating ? `⭐ ${escapeHtml(String(log.rating))}` : '';
      return `<li>
        <div class="meta">
          <span>${escapeHtml(log.type || 'unknown action')}</span>
          <span>${escapeHtml(timestamp)}</span>
        </div>
        <div>${details}</div>
        <div class="meta">
          <span>${tags}</span>
          <span>${rating}</span>
        </div>
      </li>`;
    })
    .join('');
}

function exportLogsToJson(logs) {
  if (!logs?.length) return;
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'git-stars-activity.json';
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

// Unified logging function
function logAction(type, details, tags = '', rating = '') {
  const logs = getStoredLogs();
  logs.push({ time: new Date().toISOString(), type, details, tags, rating });
  if (logs.length > 100) {
    logs.shift();
  }
  localStorage.setItem('actionLogs', JSON.stringify(logs));
  refreshActivityView();
}

function updateLogCount() {
  refreshActivityView();
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

cardStyleSelect?.addEventListener('change', () => {
  document.body.classList.remove('retro', 'futuristic', 'professional', 'terminal', 'neumorphic');
  const style = cardStyleSelect.value;
  if (style !== 'default') {
    document.body.classList.add(style);
  }
});
cardStyleSelect?.dispatchEvent(new Event('change'));

const readmePanel = document.getElementById('readmePanel');
const readmeContent = document.getElementById('readmeContent');
const closePanel = document.getElementById('closePanel');

closePanel?.addEventListener('click', () => {
  readmePanel.classList.remove('open');
  document.body.classList.remove('panel-open');
});

container.addEventListener('click', async (e) => {
  const card = e.target.closest('.repo-card');
  if (!card) return;
  const author = card.getAttribute('data-author');
  const name = card.getAttribute('data-name');
  if (!author || !name) return;

  document.body.classList.add('panel-open');
  readmePanel.classList.add('open');
  readmeContent.textContent = 'Loading README...';
  try {
    const url = `https://raw.githubusercontent.com/${author}/${name}/master/README.md`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed');
    const text = await resp.text();
    readmeContent.textContent = text;
  } catch {
    readmeContent.textContent = 'Failed to load README';
  }
});

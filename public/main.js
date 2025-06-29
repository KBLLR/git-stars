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
const starCountElem = document.getElementById('starCount');
const cardStyleSelect = document.getElementById('cardStyle');

const starCountBadge = document.getElementById('starCount');
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
  } catch (err) {
    readmeContent.textContent = 'Failed to load README';
  }
});

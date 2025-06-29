import { marked } from 'marked';

const container = document.getElementById('reposContainer');
const searchInput = document.getElementById('searchInput');
const languageFilter = document.getElementById('languageFilter');
const tagFilter = document.getElementById('tagFilter');
const licenseFilter = document.getElementById('licenseFilter');
const sortBy = document.getElementById('sortBy');
const errorMessage = document.getElementById('errorMessage');

const summarizeIcon = document.getElementById('summarizeIcon');
const tagIcon = document.getElementById('tagIcon');
const rateIcon = document.getElementById('rateIcon');
const logsIcon = document.getElementById('logsIcon');
const starCountBadge = document.getElementById('starCount');
const logsCountBadge = document.getElementById('logsCountBadge');
const logBadge = document.getElementById('logCount');
const cardStyleSelect = document.getElementById('cardStyle');

const readmePanel = document.getElementById('readmePanel');
const readmeContent = document.getElementById('readmeContent');
const closePanel = document.getElementById('closePanel');

// Escape HTML to avoid injecting markup
function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<>"'{}]/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    "'": '&#039;', '{': '&#123;', '}': '&#125;',
  }[match]));
}

let repos = [], languages = new Set(), tags = new Set(), licenses = new Set();

fetch('data.json')
  .then(r => r.ok ? r.json() : Promise.reject('Network error'))
  .then(data => {
    repos = data;
    if (starCountBadge) starCountBadge.textContent = repos.length;
    updateLogCount();

    repos.forEach(r => {
      (r.languages || []).forEach(l => languages.add(l.language));
      (r.topics || []).forEach(t => tags.add(t));
      if (r.license) licenses.add(r.license);
    });

    populateFilters();
    render();
  })
  .catch(err => {
    console.error('Data load failed:', err);
    if (errorMessage) errorMessage.textContent = 'Failed to load data.';
  });

function populateFilters() {
  languageFilter.innerHTML = '<option value="all">All Languages</option>' +
    [...languages].sort().map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
  tagFilter.innerHTML = '<option value="all">All Tags</option>' +
    [...tags].sort().map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  licenseFilter.innerHTML = '<option value="all">All Licenses</option>' +
    [...licenses].sort().map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');
}

function render() {
  const search = searchInput.value.toLowerCase();
  const lang = languageFilter.value;
  const tag = tagFilter.value;
  const lic = licenseFilter.value;

  const filtered = repos.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search) || (r.description || '').toLowerCase().includes(search);
    const matchLang = lang === 'all' || (r.languages || []).some(l => l.language === lang);
    const matchTag = tag === 'all' || (r.topics || []).includes(tag);
    const matchLic = lic === 'all' || r.license === lic;
    return matchSearch && matchLang && matchTag && matchLic;
  }).sort((a, b) => {
    switch (sortBy.value) {
      case 'name': return a.name.localeCompare(b.name);
      case 'date': return new Date(b.date) - new Date(a.date);
      case 'created': return new Date(b.last_updated) - new Date(a.last_updated);
      case 'language': return ((a.languages?.[0]?.language || '').localeCompare(b.languages?.[0]?.language || ''));
      case 'tag': return ((a.topics?.[0] || '').localeCompare(b.topics?.[0] || ''));
      default: return 0;
    }
  });

  container.innerHTML = filtered.map(repo => repoCard(repo)).join('');
}

function repoCard(repo) {
  const langs = (repo.languages || []).map(l => l.language).join(', ');
  const topics = (repo.topics || []).join(', ') || 'None';
  return `<div class="repo-card" data-author="${escapeHtml(repo.author)}" data-repo="${escapeHtml(repo.name)}">
    <h3><a href="${repo.url}" target="_blank">${escapeHtml(repo.name)}</a></h3>
    <p><strong>Author:</strong> ${escapeHtml(repo.author)}</p>
    <p><strong>Description:</strong> ${escapeHtml(repo.description)}</p>
    <div class="metrics">
      <div class="metric"><i class="fa fa-star"></i> ${repo.stars}</div>
      <div class="metric"><i class="fa fa-code-branch"></i> ${repo.forks}</div>
      <div class="metric"><i class="fa fa-bug"></i> ${repo.open_issues}</div>
      <div class="metric"><i class="fa fa-calendar"></i> ${repo.last_updated}</div>
    </div>
    <div class="languages">${langs}</div>
    <div class="topics">${escapeHtml(topics)}</div>
  </div>`;
}

searchInput.addEventListener('input', render);
languageFilter.addEventListener('change', render);
tagFilter.addEventListener('change', render);
licenseFilter.addEventListener('change', render);
sortBy.addEventListener('change', render);

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

function openReadmePanel(author, repo) {
  if (!readmePanel) return;
  document.body.classList.add('panel-open');
  readmePanel.classList.add('open');
  readmeContent.innerHTML = 'Loading...';

  const tryFetch = branch =>
    fetch(`https://raw.githubusercontent.com/${author}/${repo}/${branch}/README.md`)
      .then(r => (r.ok ? r.text() : ''));

  tryFetch('master')
    .then(text => text || tryFetch('main'))
    .then(text => {
      readmeContent.innerHTML = text ? marked.parse(text) : 'README not found';
    }).catch(() => {
      readmeContent.textContent = 'Failed to load README';
    });
}

closePanel?.addEventListener('click', () => {
  readmePanel.classList.remove('open');
  document.body.classList.remove('panel-open');
});

container?.addEventListener('click', e => {
  const card = e.target.closest('.repo-card');
  if (!card) return;
  const author = card.dataset.author;
  const repo = card.dataset.repo;
  if (author && repo) openReadmePanel(author, repo);
});

document.getElementById('action-statistics')?.addEventListener('click', () => logAction('Statistics', 'graphs'));
document.getElementById('action-notebook')?.addEventListener('click', () => logAction('Notebook LLM', 'blog'));
document.getElementById('action-chat')?.addEventListener('click', () => logAction('Chat Gemini', 'chat'));
document.getElementById('action-news')?.addEventListener('click', () => logAction('News Feed', 'news'));

summarizeIcon?.addEventListener('click', () => logAction('summarize', 'repo'));
tagIcon?.addEventListener('click', () => logAction('tag', 'repo', 'example'));
rateIcon?.addEventListener('click', () => {
  const rating = Math.floor(Math.random() * 5) + 1;
  logAction('rate', 'repo', '', rating);
});
logsIcon?.addEventListener('click', () => logAction('open-logs', 'page'));

cardStyleSelect?.addEventListener('change', () => {
  document.body.classList.remove('retro', 'futuristic', 'professional', 'terminal', 'neumorphic', 'minimalist');
  const style = cardStyleSelect.value;
  if (style !== 'default') document.body.classList.add(style);
});
cardStyleSelect?.dispatchEvent(new Event('change'));
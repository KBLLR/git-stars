const container = document.getElementById('reposContainer');
const searchInput = document.getElementById('searchInput');
const languageFilter = document.getElementById('languageFilter');
const tagFilter = document.getElementById('tagFilter');
const sortBy = document.getElementById('sortBy');
const repoCountBadge = document.getElementById('repoCountBadge');
const logsCountBadge = document.getElementById('logsCountBadge');

// Escape HTML to avoid injecting markup from repo data
function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<>"'{}]/g, match => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '{': '&#123;',
      '}': '&#125;'
    };
    return map[match];
  });
}

let repos = [];
let languages = new Set();
let tags = new Set();

fetch('data.json')
  .then(r => r.json())
.then(data => {
  repos = data;

  // Update count badges
  if (repoCountBadge) repoCountBadge.textContent = repos.length;

  const logs = JSON.parse(localStorage.getItem('logs') || '[]');
  if (logsCountBadge) logsCountBadge.textContent = logs.length;

  repos.forEach(r => {
    (r.languages || []).forEach(l => languages.add(l.language));
    (r.topics || []).forEach(t => tags.add(t));
  });

  populateFilters();
  render();
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
  filtered.sort((a,b) => {
    switch(sortValue){
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

function repoCard(repo){
  const langs = (repo.languages || []).map(l => `${l.language}`).join(', ');
  const topics = (repo.topics || []).join(', ');
  return `<div class="repo-card">
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
    <div class="topics">${escapeHtml(topics) || 'None'}</div>
  </div>`;
}

searchInput.addEventListener('input', render);
languageFilter.addEventListener('change', render);
tagFilter.addEventListener('change', render);
sortBy.addEventListener('change', render);

// Logging functionality
const logs = JSON.parse(localStorage.getItem('logs') || '[]');

function updateLogCount() {
  const logEl = document.getElementById('logCount');
  if (logEl) logEl.textContent = logs.length;
}

function addLog(action, dataType) {
  logs.push({ action, dataType, tags: [], rating: '', time: new Date().toLocaleString() });
  localStorage.setItem('logs', JSON.stringify(logs));
  updateLogCount();
}

function handleAction(action, dataType) {
  addLog(action, dataType);
  alert(`${action} action triggered`);
}

document.getElementById('action-statistics')?.addEventListener('click', () => handleAction('Statistics', 'graphs'));
document.getElementById('action-notebook')?.addEventListener('click', () => handleAction('Notebook LLM', 'blog'));
document.getElementById('action-chat')?.addEventListener('click', () => handleAction('Chat Gemini', 'chat'));
document.getElementById('action-news')?.addEventListener('click', () => handleAction('News Feed', 'news'));

updateLogCount();


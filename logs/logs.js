const container = document.getElementById('logsContainer');
const badge = document.getElementById('logsCountBadge');
const exportButton = document.getElementById('exportLogsBtn');
const rowTemplate = document.getElementById('logRowTemplate');

function getStoredLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem('actionLogs') || '[]');
    return Array.isArray(logs) ? logs : [];
  } catch (error) {
    console.error('Unable to read stored logs', error);
    return [];
  }
}

function formatTimestamp(value) {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function renderLogs() {
  const logs = getStoredLogs();

  if (badge) {
    badge.textContent = logs.length;
  }

  if (!logs.length) {
    container.innerHTML = '<p class="log-empty">No logs yet. Start using the app to generate activity.</p>';
    return;
  }

  if (!rowTemplate) {
    container.innerHTML = logs
      .map(log => `
        <div class="log-entry">
          <div class="log-entry__meta">
            <strong>${log.type || 'unknown action'}</strong>
            <span>${formatTimestamp(log.time)}</span>
          </div>
          <div class="log-entry__details">${log.details || ''}</div>
          <div class="log-entry__tags">${Array.isArray(log.tags) ? log.tags.join(', ') : (log.tags || '')}</div>
        </div>
      `)
      .join('');
    return;
  }

  const fragment = document.createDocumentFragment();
  logs
    .slice()
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .forEach(log => {
      const clone = rowTemplate.content.firstElementChild.cloneNode(true);
      clone.querySelector('.log-entry__meta').innerHTML = `
        <strong>${log.type || 'unknown action'}</strong>
        <span>${formatTimestamp(log.time)}</span>`;
      clone.querySelector('.log-entry__details').textContent = log.details || 'No details provided';
      const tagValue = Array.isArray(log.tags) ? log.tags.join(', ') : (log.tags || '—');
      const rating = log.rating ? ` | Rating: ${log.rating}` : '';
      clone.querySelector('.log-entry__tags').textContent = `${tagValue}${rating}`;
      fragment.appendChild(clone);
    });

  container.innerHTML = '';
  container.appendChild(fragment);
}

function exportLogs() {
  const logs = getStoredLogs();
  if (!logs.length) {
    alert('No activity available to export yet.');
    return;
  }
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

exportButton?.addEventListener('click', exportLogs);

renderLogs();

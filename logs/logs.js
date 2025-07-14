const container = document.getElementById('logsContainer');
const logs = JSON.parse(localStorage.getItem('logs') || '[]');

function renderLogs() {
  if (!logs.length) {
    container.textContent = 'No logs yet.';
    return;
  }
  container.innerHTML = logs.map(log => `
    <div class="log-entry">
      <div><strong>Action:</strong> ${log.action}</div>
      <div><strong>Data:</strong> ${log.dataType}</div>
      <div><strong>Tags:</strong> ${(log.tags || []).join(', ')}</div>
      <div><strong>Rating:</strong> ${log.rating ?? ''}</div>
      <div><em>${log.time}</em></div>
    </div>
  `).join('');
}

renderLogs();

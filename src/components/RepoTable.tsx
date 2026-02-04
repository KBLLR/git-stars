import { Lock } from 'lucide-react';
import { Repo } from '../types';

interface RepoTableProps {
  repos: Repo[];
  onRowClick?: (repo: Repo) => void;
}

const DONUT_COLORS = ['#1f1f1f', '#d94a2b', '#8a8f86', '#cfd2cb', '#5a5e57'];

const parsePercent = (value?: string) => {
  if (!value) return 0;
  const parsed = parseFloat(value.replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

function LanguageDonut({ repo }: { repo: Repo }) {
  const entries = (repo.languages || [])
    .map((lang) => ({ label: lang.language, value: parsePercent(lang.percentage) }))
    .filter((item) => item.value > 0);

  const top = entries.slice(0, 4);
  const other = entries.slice(4).reduce((sum, item) => sum + item.value, 0);
  if (other > 0) {
    top.push({ label: 'Other', value: other });
  }

  const total = top.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const tooltip = top.map((item) => `${item.label}: ${item.value.toFixed(1)}%`).join('\n');

  return (
    <div className="lang-donut" title={tooltip}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#e2e5df"
          strokeWidth="6"
        />
        {top.map((item, index) => {
          const dash = (item.value / total) * circumference;
          const strokeDasharray = `${dash} ${circumference - dash}`;
          const strokeDashoffset = -offset;
          offset += dash;
          return (
            <circle
              key={item.label}
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
              strokeWidth="6"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 20 20)"
            />
          );
        })}
      </svg>
    </div>
  );
}

export function RepoTable({ repos, onRowClick }: RepoTableProps) {
  return (
    <table className="log-table repo-table">
      <thead>
        <tr>
          <th className="col-name">Name</th>
          <th className="col-author">Author</th>
          <th className="col-description">Description</th>
          <th className="col-languages">Languages</th>
          <th className="col-topics">Topics</th>
          <th className="col-stars">Stars</th>
          <th className="col-forks">Forks</th>
          <th className="col-issues">Open Issues</th>
          <th className="col-starred">Starred On</th>
          <th className="col-updated">Last Upd.</th>
        </tr>
      </thead>
      <tbody>
        {repos.map((repo, idx) => (
          <tr
            key={`${repo.author}-${repo.name}-${idx}`}
            className={onRowClick ? 'clickable' : undefined}
            onClick={() => onRowClick?.(repo)}
            tabIndex={onRowClick ? 0 : -1}
            onKeyDown={(event) => {
              if (!onRowClick) return;
              if (event.key === 'Enter') onRowClick(repo);
            }}
          >
            <td className="col-name">
              {repo.private ? (
                <span className="repo-name-lock" title="Private repository">
                  <Lock size={12} />
                </span>
              ) : null}
              {repo.name}
            </td>
            <td className="col-author">{repo.author}</td>
            <td className="col-description" title={repo.description || ''}>{repo.description}</td>
            <td className="col-languages"><LanguageDonut repo={repo} /></td>
            <td className="col-topics" title={repo.topics.join(', ') || ''}>{repo.topics.join(', ') || 'None'}</td>
            <td className="col-stars">{repo.stars}</td>
            <td className="col-forks">{repo.forks}</td>
            <td className="col-issues">{repo.open_issues}</td>
            <td className="col-starred">{repo.date}</td>
            <td className="col-updated">{repo.last_updated}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

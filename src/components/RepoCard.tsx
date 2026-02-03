import { Repo } from '../types';
import { Star, GitFork, Bug, Calendar } from 'lucide-react';

interface RepoCardProps {
  repo: Repo;
  onClick: (repo: Repo) => void;
}

export function RepoCard({ repo, onClick }: RepoCardProps) {
  return (
    <div className="repo-card" onClick={() => onClick(repo)}>
      <h3>
        <a href={repo.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {repo.name}
        </a>
      </h3>
      <p>
        <strong>Author:</strong> {repo.author}
      </p>
      <p>
        <strong>Description:</strong> {repo.description}
      </p>
      <div className="metrics">
        <div className="metric">
          <Star size={16} className="icon" /> {repo.stars}
        </div>
        <div className="metric">
          <GitFork size={16} className="icon" /> {repo.forks}
        </div>
        <div className="metric">
          <Bug size={16} className="icon" /> {repo.open_issues}
        </div>
        <div className="metric">
          <Calendar size={16} className="icon" /> {repo.last_updated}
        </div>
      </div>
      <div className="languages">
        {repo.languages.map((l) => `${l.language} (${l.percentage})`).join(', ') || 'N/A'}
      </div>
      <div className="topics">{repo.topics.join(', ') || 'None'}</div>
    </div>
  );
}

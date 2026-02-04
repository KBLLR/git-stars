import type { MouseEvent } from 'react';
import { Repo } from '../types';
import { Star, GitFork, Calendar, MessageSquare, Microscope, Copy, Bookmark, Lock } from 'lucide-react';

interface RepoCardProps {
  repo: Repo;
  onClick: (repo: Repo) => void;
  onChat?: (repo: Repo) => void;
  onResearch?: (repo: Repo) => void;
  onSimilar?: (repo: Repo) => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>, repo: Repo) => void;
  onBookmark?: (repo: Repo) => void;
  isBookmarked?: boolean;
}

export function RepoCard({ repo, onClick, onChat, onResearch, onSimilar, onContextMenu, onBookmark, isBookmarked }: RepoCardProps) {
  return (
    <div
      className="repo-card"
      onClick={() => onClick(repo)}
      onContextMenu={(event) => onContextMenu?.(event, repo)}
    >
      <button
        className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onBookmark?.(repo);
        }}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark repo'}
      >
        <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
      </button>
      <h3 className="repo-title">
        <a href={repo.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {repo.private ? (
            <span className="repo-title__lock" title="Private repository">
              <Lock size={14} />
            </span>
          ) : null}
          {repo.name}
        </a>
      </h3>
      
      <div className="repo-metrics">
        <div className="metric-item">
          <Star size={14} /> {repo.stars}
        </div>
        <div className="metric-item">
          <GitFork size={14} /> {repo.forks}
        </div>
        <div className="metric-item">
          <Calendar size={14} className="text-muted" /> 
           Last active: {repo.last_updated}
        </div>
      </div>

      <p className="repo-desc">
        {repo.description || "No description provided."}
      </p>

      <div className="chip-group">
        {repo.languages.slice(0, 3).map((l) => (
          <span key={l.language} className="chip chip-lang">
            {l.language}
          </span>
        ))}
        {repo.topics.slice(0, 4).map((t) => (
           <span key={t} className="chip chip-tag">
             {t}
           </span>
        ))}
        <span className="chip" style={{ color: '#94a3b8', border: 'none', paddingLeft: 0 }}>
            <Calendar size={12} style={{ marginRight: 4 }} /> 
            Starred {repo.date}
        </span>
      </div>

      <div className="card-actions">
         <button 
           className="action-btn primary"
           onClick={(e) => { e.stopPropagation(); onChat?.(repo); }}
           title="Open readme actions"
         >
           <MessageSquare size={14} /> Actions
         </button>
         <button 
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); onResearch?.(repo); }}
            title="Mark for Research"
         >
           <Microscope size={14} /> Research
         </button>
         <button 
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); onSimilar?.(repo); }}
            title="Find Similar"
         >
           <Copy size={14} /> Similar
         </button>
      </div>
    </div>
  );
}

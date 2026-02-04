import { Repo } from '../types';

interface MyReposPanelProps {
  myRepos: Repo[];
  renderRepoCard: (repo: Repo) => JSX.Element;
}

const uniqueById = (repos: Repo[]) => {
  const seen = new Set<string>();
  return repos.filter((repo) => {
    const key = `${repo.author}/${repo.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function MyReposPanel({ myRepos, renderRepoCard }: MyReposPanelProps) {
  const owned = uniqueById(myRepos);

  return (
    <div className="my-repos-view">
      {owned.length === 0 && (
        <div className="my-repos-empty">
          <h2>No synced repos yet</h2>
          <p>Run the Git automation workflow to pull public/private repos.</p>
        </div>
      )}
      <div className="repos-grid">
        {owned.map((repo) => renderRepoCard(repo))}
      </div>
    </div>
  );
}

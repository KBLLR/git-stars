import type { JSX } from "react";
import type { MineHealthRecord, Repo } from "../types";

interface MyReposPanelProps {
  myRepos: Repo[];
  mineHealth: MineHealthRecord[];
  renderRepoCard: (repo: Repo) => JSX.Element;
  onLaunchAction: (repo: Repo, prompt: string, useChat?: boolean) => void;
}

function uniqueById(repos: Repo[]) {
  const seen = new Set<string>();
  return repos.filter((repo) => {
    const key = `${repo.author}/${repo.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function MyReposPanel({ myRepos, mineHealth, renderRepoCard, onLaunchAction }: MyReposPanelProps) {
  const owned = uniqueById(myRepos);
  const healthByNwo = new Map(mineHealth.map((record) => [record.nwo, record]));

  const missingReadme = owned.filter((repo) => healthByNwo.get(`${repo.author}/${repo.name}`)?.healthFlags.includes("missing-readme"));
  const staleRepos = owned.filter((repo) => healthByNwo.get(`${repo.author}/${repo.name}`)?.healthFlags.includes("stale"));
  const templateCandidates = owned.filter((repo) => healthByNwo.get(`${repo.author}/${repo.name}`)?.healthFlags.includes("template-candidate"));

  return (
    <div className="my-repos-view">
      <section className="highlights-hero">
        <h2>Execution Workspace</h2>
        <p>
          Mine is now for action: README coverage, maintenance work, template extraction, and model-ready mission briefs.
        </p>
      </section>

      <div className="highlights-grid" style={{ marginBottom: 24 }}>
        <div className="highlight-card">
          <h3>README Gaps</h3>
          <p>{missingReadme.length} repos need documentation attention.</p>
          <ul>
            {missingReadme.slice(0, 5).map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onLaunchAction(repo, "Use get_mine_health and explain how to get this repo README-ready.", false)}>
                  {repo.name}
                </button>
              </li>
            ))}
            {missingReadme.length === 0 && <p>No README gaps detected.</p>}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Maintenance Queue</h3>
          <p>{staleRepos.length} repos are stale enough to justify a maintenance pass.</p>
          <ul>
            {staleRepos.slice(0, 5).map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onLaunchAction(repo, "Use get_mine_health and produce a maintenance plan for this repo.", false)}>
                  {repo.name}
                </button>
              </li>
            ))}
            {staleRepos.length === 0 && <p>No stale repos in the current Mine selection.</p>}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Template Candidates</h3>
          <p>{templateCandidates.length} repos look reusable as templates or scaffolds.</p>
          <ul>
            {templateCandidates.slice(0, 5).map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onLaunchAction(repo, "Use extract_repo_skills and decide whether this repo should become a reusable template.", false)}>
                  {repo.name}
                </button>
              </li>
            ))}
            {templateCandidates.length === 0 && <p>No template candidates in the current Mine selection.</p>}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Mission Briefs</h3>
          <p>Generate implementation-ready missions for owned repos without leaving Mine.</p>
          <ul>
            {owned.slice(0, 5).map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onLaunchAction(repo, "Generate a Codex mission for this repo.", true)}>
                  {repo.name} <span>Codex</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {owned.length === 0 && (
        <div className="my-repos-empty">
          <h2>No synced repos yet</h2>
          <p>Run the Git automation workflow to pull public and private repos.</p>
        </div>
      )}

      <div className="repos-grid">
        {owned.map((repo) => renderRepoCard(repo))}
      </div>
    </div>
  );
}

import type { ActionItem, OpsDigest, Repo, RepoSignal, ResearchQueueItem } from "../types";

interface HighlightsPanelProps {
  repos: Repo[];
  myRepos: Repo[];
  repoSignals: RepoSignal[];
  researchQueue: ResearchQueueItem[];
  actionItems: ActionItem[];
  opsDigest: OpsDigest | null;
  bookmarks: Repo[];
  history: Repo[];
  onSelectRepo: (repo: Repo) => void;
  onLaunchAction: (repo: Repo, prompt: string) => void;
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

function findRepo(repos: Repo[], nwo: string) {
  return repos.find((repo) => `${repo.author}/${repo.name}` === nwo) ?? null;
}

export function HighlightsPanel({
  repos,
  myRepos,
  repoSignals,
  researchQueue,
  actionItems,
  opsDigest,
  bookmarks,
  history,
  onSelectRepo,
  onLaunchAction,
}: HighlightsPanelProps) {
  const repoPool = [...myRepos, ...repos];
  const recentUpdates = repoSignals
    .filter((signal) => signal.scope === "research" || signal.scope === "mine" || signal.adoptionScore >= 55)
    .slice(0, 6);

  const adoptionRadar = repoSignals
    .filter((signal) => signal.adoptionKind !== "ignore")
    .slice(0, 6);

  const skillOpportunities = repoSignals
    .filter((signal) => signal.houseSkills.length > 0)
    .slice(0, 6);

  const recommendedActions = [
    ...actionItems
      .filter((item) => item.status === "open" || item.status === "reviewing")
      .slice(0, 3)
      .map((item) => ({
        title: item.title,
        detail: item.summary,
        repo: findRepo(repoPool, item.nwo),
        prompt: `Review Vega Lab action item ${item.id}. Use list_action_items and produce the next review step.`,
      })),
    ...researchQueue
      .filter((item) => item.status !== "done" && item.status !== "dismissed")
      .slice(0, 2)
      .map((item) => ({
        title: `Advance research for ${item.nwo.split("/")[1]}`,
        detail: item.notes || "Move this repo through the research queue and write a brief.",
        repo: findRepo(repoPool, item.nwo),
        prompt: "Advance this repo in the research queue and summarize the adoption decision.",
      })),
    ...adoptionRadar.slice(0, 2).map((signal) => ({
      title: `Score adoption for ${signal.name}`,
      detail: `${signal.adoptionKind} candidate · score ${signal.adoptionScore}`,
      repo: findRepo(repoPool, signal.nwo),
      prompt: "Explain the adoption fit for this repo and turn it into a next action.",
    })),
    ...recentUpdates.slice(0, 1).map((signal) => ({
      title: `Review update for ${signal.name}`,
      detail: `Recent scope: ${signal.scope} · staleness ${signal.staleness}`,
      repo: findRepo(repoPool, signal.nwo),
      prompt: "Summarize why this repo matters now and what to do next.",
    })),
  ].filter((item) => item.repo !== null);

  const recentHistory = uniqueById(history).slice(0, 5);

  return (
    <div className="highlights-view">
      <section className="highlights-hero">
        <h2>Vega Lab Intelligence</h2>
        <p>
          {opsDigest?.summary || "Recent updates, adoption signals, queued research, skill opportunities, and ops actions are grounded in the same house data."}
        </p>
      </section>

      <div className="highlights-grid">
        <div className="highlight-card">
          <h3>Recent Updates</h3>
          <ul>
            {recentUpdates.map((signal) => {
              const repo = findRepo(repoPool, signal.nwo);
              if (!repo) return null;
              return (
                <li key={signal.nwo}>
                  <button onClick={() => onSelectRepo(repo)}>
                    {signal.name} <span>{signal.scope} · {signal.staleness}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Adoption Radar</h3>
          <ul>
            {adoptionRadar.map((signal) => {
              const repo = findRepo(repoPool, signal.nwo);
              if (!repo) return null;
              return (
                <li key={signal.nwo}>
                  <button onClick={() => onSelectRepo(repo)}>
                    {signal.name} <span>{signal.adoptionKind} · {signal.adoptionScore}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Research Queue</h3>
          <ul>
            {researchQueue.slice(0, 6).map((item) => {
              const repo = findRepo(repoPool, item.nwo);
              return (
                <li key={item.nwo}>
                  {repo ? (
                    <button onClick={() => onSelectRepo(repo)}>
                      {repo.name} <span>{item.status}</span>
                    </button>
                  ) : (
                    <span>{item.nwo} <span>{item.status}</span></span>
                  )}
                </li>
              );
            })}
            {researchQueue.length === 0 && <p>No queued research yet.</p>}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Skill Opportunities</h3>
          <ul>
            {skillOpportunities.map((signal) => {
              const repo = findRepo(repoPool, signal.nwo);
              if (!repo) return null;
              return (
                <li key={signal.nwo}>
                  <button onClick={() => onSelectRepo(repo)}>
                    {signal.name} <span>{signal.houseSkills.slice(0, 2).join(", ")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Ops Inbox</h3>
          <ul>
            {recommendedActions.map((action) => (
              <li key={action.title}>
                <strong>{action.title}</strong>
                <p>{action.detail}</p>
                {action.repo ? (
                  <button onClick={() => onLaunchAction(action.repo as Repo, action.prompt)}>Run</button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Bookmarked Focus</h3>
          <ul>
            {uniqueById(bookmarks).slice(0, 5).map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onSelectRepo(repo)}>
                  {repo.name}
                </button>
              </li>
            ))}
            {bookmarks.length === 0 && <p>No bookmarks yet.</p>}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Mine Snapshot</h3>
          <ul>
            {myRepos.slice(0, 5).map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onSelectRepo(repo)}>
                  {repo.name} <span>{repo.private ? "private" : "public"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Recent Views</h3>
          <ul>
            {recentHistory.map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onSelectRepo(repo)}>
                  {repo.name}
                </button>
              </li>
            ))}
            {recentHistory.length === 0 && <p>No recent views yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

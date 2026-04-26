import { useMemo, useState } from "react";
import type { ActionItem, OpsDigest, Repo, WeeklyResearchReview } from "../types";

interface OpsInboxPanelProps {
  actionItems: ActionItem[];
  opsDigest: OpsDigest | null;
  weeklyResearchReview: WeeklyResearchReview | null;
  repos: Repo[];
  onSelectRepo: (repo: Repo) => void;
  onLaunchAction: (repo: Repo, prompt: string) => void;
}

function findRepo(repos: Repo[], nwo: string) {
  return repos.find((repo) => `${repo.author}/${repo.name}` === nwo) ?? null;
}

export function OpsInboxPanel({
  actionItems,
  opsDigest,
  weeklyResearchReview,
  repos,
  onSelectRepo,
  onLaunchAction,
}: OpsInboxPanelProps) {
  const [status, setStatus] = useState("active");
  const [kind, setKind] = useState("all");

  const visibleItems = useMemo(() => {
    return actionItems.filter((item) => {
      const statusMatch =
        status === "all"
        || (status === "active" ? item.status === "open" || item.status === "reviewing" : item.status === status);
      const kindMatch = kind === "all" || item.kind === kind;
      return statusMatch && kindMatch;
    });
  }, [actionItems, kind, status]);

  return (
    <div className="ops-view">
      <section className="highlights-hero ops-hero">
        <div>
          <h2>Vega Lab Ops Inbox</h2>
          <p>{opsDigest?.summary || "Draft-only actions from repo intelligence, Mine health, research, and skill extraction."}</p>
        </div>
        <div className="ops-metrics">
          <span>{opsDigest?.counts.openActions ?? actionItems.filter((item) => item.status === "open").length} open</span>
          <span>{opsDigest?.counts.criticalActions ?? actionItems.filter((item) => item.priority === "high" || item.priority === "critical").length} high priority</span>
          <span>{weeklyResearchReview?.skillCandidates.length ?? 0} skill leads</span>
        </div>
      </section>

      <div className="ops-toolbar">
        <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="active">Active</option>
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="reviewing">Reviewing</option>
          <option value="accepted">Accepted</option>
          <option value="dismissed">Dismissed</option>
          <option value="done">Done</option>
        </select>
        <select className="filter-select" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">All kinds</option>
          <option value="readme">README</option>
          <option value="maintenance">Maintenance</option>
          <option value="deployment">Deployment</option>
          <option value="testing">Testing</option>
          <option value="research">Research</option>
          <option value="skill">Skill</option>
          <option value="template">Template</option>
          <option value="adoption">Adoption</option>
        </select>
      </div>

      <div className="ops-grid">
        {visibleItems.map((item) => {
          const repo = findRepo(repos, item.nwo);
          return (
            <article className="ops-item" key={item.id}>
              <header>
                <span className={`ops-priority ${item.priority}`}>{item.priority}</span>
                <span className="ops-kind">{item.kind}</span>
                <span className="ops-status">{item.status}</span>
              </header>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="ops-evidence">
                {item.evidence.slice(0, 3).map((entry) => (
                  <span key={entry}>{entry}</span>
                ))}
              </div>
              <div className="ops-links">
                {item.linkedSkills.slice(0, 3).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <footer>
                {repo ? <button onClick={() => onSelectRepo(repo)}>Open repo</button> : null}
                {repo ? (
                  <button
                    className="primary"
                    onClick={() => onLaunchAction(repo, `Review Vega Lab action item ${item.id}. Use list_action_items, inspect_owned_repo, and update_action_item only if I explicitly approve a status change.`)}
                  >
                    Review draft
                  </button>
                ) : null}
              </footer>
            </article>
          );
        })}
      </div>

      {visibleItems.length === 0 && (
        <div className="my-repos-empty">
          <h2>No matching actions</h2>
          <p>The inbox is clean for the selected filters. Run the daily ops or weekly research automation to draft new work.</p>
        </div>
      )}
    </div>
  );
}

import { Repo } from '../types';

interface HighlightsPanelProps {
  repos: Repo[];
  bookmarks: Repo[];
  history: Repo[];
  onSelectRepo: (repo: Repo) => void;
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

export function HighlightsPanel({ repos, bookmarks, history, onSelectRepo }: HighlightsPanelProps) {
  const topStarred = [...repos]
    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
    .slice(0, 5);

  const recentUpdated = [...repos]
    .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
    .slice(0, 5);

  const topicCounts = new Map<string, number>();
  repos.forEach((repo) => {
    (repo.topics || []).forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });
  });
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic]) => topic);

  const ideaSeeds = topTopics.slice(0, 3).map((topic) => ({
    title: `Idea: ${topic} exploration`,
    detail: `Spin up a quick evaluation of starred repos tagged with ${topic} and map them to active house initiatives.`,
  }));

  const recentHistory = uniqueById(history).slice(0, 5);

  return (
    <div className="highlights-view">
      <section className="highlights-hero">
        <h2>Daily Intelligence</h2>
        <p>
          Highlights compiled from your starred repos. Use these as starting points for research and
          ecosystem alignment. The system will become more personalized as user memory matures.
        </p>
      </section>

      <div className="highlights-grid">
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
          <h3>Top Starred</h3>
          <ul>
            {topStarred.map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onSelectRepo(repo)}>
                  {repo.name} <span>{repo.stars}★</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Recently Updated</h3>
          <ul>
            {recentUpdated.map((repo) => (
              <li key={`${repo.author}/${repo.name}`}>
                <button onClick={() => onSelectRepo(repo)}>
                  {repo.name} <span>{repo.last_updated}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="highlight-card">
          <h3>Active Topics</h3>
          <div className="topic-chips">
            {topTopics.map((topic) => (
              <span key={topic} className="chip chip-tag">{topic}</span>
            ))}
          </div>
        </div>

        <div className="highlight-card">
          <h3>Idea Seeds</h3>
          <ul>
            {ideaSeeds.map((idea) => (
              <li key={idea.title}>
                <strong>{idea.title}</strong>
                <p>{idea.detail}</p>
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

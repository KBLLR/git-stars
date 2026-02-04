import { useMemo } from 'react';
import { Repo } from '../types';
import { BarChart3, Star, Code, Hash, ShieldCheck, Layers } from 'lucide-react';
import { TopicTimeline } from './TopicTimeline';

interface StatisticsProps {
  starredRepos: Repo[];
  myRepos: Repo[];
}

const FRAMEWORK_KEYWORDS = [
  { label: 'React', keys: ['react', 'reactjs', 'react-native'] },
  { label: 'Next.js', keys: ['nextjs', 'next.js', 'next'] },
  { label: 'Vue', keys: ['vue', 'vuejs'] },
  { label: 'Svelte', keys: ['svelte'] },
  { label: 'Angular', keys: ['angular'] },
  { label: 'Node.js', keys: ['node', 'nodejs', 'node.js'] },
  { label: 'Django', keys: ['django'] },
  { label: 'Flask', keys: ['flask'] },
  { label: 'FastAPI', keys: ['fastapi'] },
  { label: 'Rails', keys: ['rails', 'ruby-on-rails'] },
  { label: 'Spring', keys: ['spring', 'springboot', 'spring-boot'] },
  { label: 'Flutter', keys: ['flutter'] },
  { label: 'SwiftUI', keys: ['swiftui'] },
  { label: 'Unity', keys: ['unity'] },
  { label: 'Three.js', keys: ['threejs', 'three.js'] },
];

const APP_TYPE_KEYWORDS = [
  { label: 'Web App', keys: ['web', 'frontend', 'ui', 'dashboard'] },
  { label: 'API / Backend', keys: ['api', 'backend', 'server', 'rest', 'graphql'] },
  { label: 'CLI Tool', keys: ['cli', 'command-line', 'terminal'] },
  { label: 'Mobile', keys: ['mobile', 'ios', 'android', 'flutter', 'react-native'] },
  { label: 'Library', keys: ['library', 'sdk', 'framework', 'package'] },
  { label: 'ML / AI', keys: ['ml', 'machine-learning', 'ai', 'llm', 'nlp', 'vision'] },
  { label: 'Data', keys: ['data', 'dataset', 'etl', 'pipeline'] },
  { label: 'DevOps', keys: ['devops', 'ci', 'cd', 'infra', 'kubernetes', 'docker', 'terraform'] },
  { label: 'Game / 3D', keys: ['game', 'unity', 'unreal', '3d'] },
  { label: 'Design', keys: ['design', 'ui', 'ux', 'figma'] },
];

function normalizeText(repo: Repo): string {
  return [
    repo.name,
    repo.description || '',
    (repo.topics || []).join(' '),
    (repo.languages || []).map((l) => l.language).join(' '),
    repo.primary_language || '',
    repo.language || '',
  ]
    .join(' ')
    .toLowerCase();
}

function countKeywords(repos: Repo[], definitions: { label: string; keys: string[] }[]) {
  const counts: Record<string, number> = {};
  repos.forEach((repo) => {
    const text = normalizeText(repo);
    definitions.forEach((def) => {
      const hit = def.keys.some((key) => text.includes(key));
      if (hit) counts[def.label] = (counts[def.label] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function isProductionReady(repo: Repo): boolean {
  const license = (repo.license || '').toLowerCase();
  const hasLicense = license && license !== 'none' && license !== 'noassertion';
  const hasReadme = repo.has_readme !== false;
  const hasPopularity = (repo.stars || 0) >= 50 || (repo.forks || 0) >= 20;
  const last = repo.last_updated_at || repo.last_updated || repo.date || repo.created_at || '';
  const parsed = Date.parse(last);
  const recent = Number.isFinite(parsed) ? parsed >= Date.now() - 365 * 24 * 60 * 60 * 1000 : true;
  const score = [hasLicense, hasReadme, hasPopularity, recent].filter(Boolean).length;
  return score >= 3;
}

function buildStats(repos: Repo[]) {
  const totalRepos = repos.length;
  const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
  const languages: Record<string, number> = {};
  const topics: Record<string, number> = {};

  repos.forEach((r) => {
    const primLang = r.languages?.[0]?.language || r.primary_language || r.language;
    if (primLang) {
      languages[primLang] = (languages[primLang] || 0) + 1;
    }
    (r.topics || []).forEach((t) => {
      topics[t] = (topics[t] || 0) + 1;
    });
  });

  const sortedLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const sortedTopics = Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const techStack = countKeywords(repos, FRAMEWORK_KEYWORDS).slice(0, 8);
  const appTypes = countKeywords(repos, APP_TYPE_KEYWORDS).slice(0, 8);
  const productionReady = repos.filter((repo) => isProductionReady(repo)).length;

  return {
    totalRepos,
    totalStars,
    sortedLangs,
    sortedTopics,
    techStack,
    appTypes,
    productionReady,
  };
}

function StatsPanel({
  title,
  repos,
  extraCards = [],
}: {
  title: string;
  repos: Repo[];
  extraCards?: { label: string; value: string | number; icon?: JSX.Element }[];
}) {
  const stats = useMemo(() => buildStats(repos), [repos]);
  const maxLangCount = stats.sortedLangs[0]?.[1] || 1;
  const productionPercent = stats.totalRepos
    ? Math.round((stats.productionReady / stats.totalRepos) * 100)
    : 0;

  return (
    <section className="stats-panel">
      <header className="stats-panel__header">
        <h3 className="stats-panel__title">{title}</h3>
        <div className="stats-panel__meta text-muted">
          {stats.totalRepos} repos · {stats.totalStars.toLocaleString()} stars
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Repositories</div>
          <div className="stat-value">{stats.totalRepos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Stars</div>
          <div className="stat-value">
            {stats.totalStars.toLocaleString()} <Star size={22} fill="#fbbf24" stroke="#fbbf24" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Production Ready</div>
          <div className="stat-value">
            <ShieldCheck size={22} /> {productionPercent}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Language</div>
          <div className="stat-value">
             <Code size={22} /> {stats.sortedLangs[0]?.[0] || 'N/A'}
          </div>
        </div>
        {extraCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">
              {card.icon}
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3 className="chart-title">Top Languages</h3>
          {stats.sortedLangs.map(([lang, count]) => (
            <div key={lang} className="chart-bar-row">
              <div className="chart-bar-label">
                <span>{lang}</span>
                <span>{count}</span>
              </div>
              <div className="chart-bar-bg">
                <div className="chart-bar-fill" style={{ width: `${(count / maxLangCount) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Top Topics</h3>
          <div className="topic-cloud">
            {stats.sortedTopics.map(([topic, count]) => (
              <span key={topic} className="topic-pill">
                <Hash size={12} /> {topic} <span className="text-muted text-xs">({count})</span>
              </span>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Most Used Tech Stack</h3>
          <div className="topic-cloud">
            {stats.techStack.map(([name, count]) => (
              <span key={name} className="topic-pill">
                <Layers size={12} /> {name} <span className="text-muted text-xs">({count})</span>
              </span>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Type of App</h3>
          <div className="topic-cloud">
            {stats.appTypes.map(([name, count]) => (
              <span key={name} className="topic-pill">
                <Hash size={12} /> {name} <span className="text-muted text-xs">({count})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <TopicTimeline repos={repos} />
    </section>
  );
}

export function Statistics({ starredRepos, myRepos }: StatisticsProps) {
  const ownedRepos = useMemo(
    () => myRepos.filter((repo) => repo.is_owner !== false),
    [myRepos]
  );
  const contribCount = useMemo(
    () => myRepos.filter((repo) => repo.is_owner === false).length,
    [myRepos]
  );

  return (
    <div className="statistics-view">
      <h2 className="stats-header">
        <BarChart3 /> Analytics
      </h2>

      <div className="stats-split">
        <StatsPanel title="Starred Repos" repos={starredRepos} />
        <StatsPanel
          title="My Repos"
          repos={ownedRepos}
          extraCards={[
            {
              label: 'Contributions',
              value: contribCount,
              icon: <Hash size={20} />,
            },
          ]}
        />
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { Repo } from '../types';
import { BarChart3, Star, Code, Hash } from 'lucide-react';
import { TopicTimeline } from './TopicTimeline';

interface StatisticsProps {
  repos: Repo[];
}

export function Statistics({ repos }: StatisticsProps) {
  const stats = useMemo(() => {
    const totalRepos = repos.length;
    const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
    const languages: Record<string, number> = {};
    const topics: Record<string, number> = {};

    repos.forEach((r) => {
      // Primary language
      const primLang = r.languages?.[0]?.language;
      if (primLang) {
        languages[primLang] = (languages[primLang] || 0) + 1;
      }
      // Topics
      r.topics?.forEach((t) => {
        topics[t] = (topics[t] || 0) + 1;
      });
    });

    const sortedLangs = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const sortedTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { totalRepos, totalStars, sortedLangs, sortedTopics };
  }, [repos]);

  const maxLangCount = stats.sortedLangs[0]?.[1] || 1;

  return (
    <div className="statistics-view" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 /> Analytics
      </h2>
      
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', marginBottom: '5px' }}>Total Repositories</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalRepos}</div>
        </div>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', marginBottom: '5px' }}>Total Stars</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {stats.totalStars.toLocaleString()} <Star size={20} fill="#fbbf24" stroke="#fbbf24" />
          </div>
        </div>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', marginBottom: '5px' }}>Top Language</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
             <Code size={20} /> {stats.sortedLangs[0]?.[0] || 'N/A'}
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div className="chart-container" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Top Languages</h3>
          {stats.sortedLangs.map(([lang, count]) => (
            <div key={lang} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                <span>{lang}</span>
                <span>{count}</span>
              </div>
              <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '4px', height: '8px' }}>
                <div style={{ width: `${(count / maxLangCount) * 100}%`, background: '#3b82f6', borderRadius: '4px', height: '100%' }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="chart-container" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Top Topics</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {stats.sortedTopics.map(([topic, count]) => (
              <span key={topic} style={{ background: '#f1f5f9', padding: '5px 10px', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Hash size={12} /> {topic} <span style={{ opacity: 0.6, fontSize: '0.8em' }}>({count})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      
      <div style={{ marginTop: '20px' }}>
        <TopicTimeline repos={repos} />
      </div>
    </div>
  );
}

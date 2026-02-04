import { useState, useEffect, useMemo } from 'react';
import type { MouseEvent } from 'react';
import { LanguageGroup, Repo } from './types';
import { RepoCard } from './components/RepoCard';
import { RepoTable } from './components/RepoTable';
import { ReadmePanel } from './components/ReadmePanel';
import { Statistics } from './components/Statistics';
import { ActivityLog } from './components/ActivityLog';
import { HighlightsPanel } from './components/HighlightsPanel';
import { MyReposPanel } from './components/MyReposPanel';
import { logger } from './lib/logger';
import { Search, Github, LayoutGrid, Table as TableIcon, BarChart3, Star, Activity, Compass, User } from 'lucide-react';

function App() {
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'table' | 'statistics' | 'activity' | 'news' | 'mine'>('cards');
  
  // Readme Panel State
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);

  const [readmeAction, setReadmeAction] = useState<string | null>(null);
  const [readmeAutoRun, setReadmeAutoRun] = useState(false);
  const [bookmarks, setBookmarks] = useState<Repo[]>([]);
  const [history, setHistory] = useState<Repo[]>([]);
  const [myRepos, setMyRepos] = useState<Repo[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; repo: Repo } | null>(null);

  const handleRepoClick = (repo: Repo) => {
    logger.logEvent(logger.createRepoViewEvent(repo, view === 'table' ? 'table' : 'card'));
    setSelectedRepo(repo);
    setIsReadmeOpen(true);
    recordHistory(repo);
  };

  const openReadmeWithAction = (repo: Repo, prompt?: string, autoRun = false) => {
    setSelectedRepo(repo);
    setIsReadmeOpen(true);
    if (prompt) {
      setReadmeAction(prompt);
      setReadmeAutoRun(autoRun);
    }
  };

  const handleResearch = (repo: Repo) => {
      logger.logEvent({
          type: 'git-stars:research_started',
          house_id: 'git-stars',
          timestamp: new Date().toISOString(),
          data: { 
              action: 'research',
              repo_name: repo.name,
              message: `Marking ${repo.name} for research...`
          }
      });
      openReadmeWithAction(
        repo,
        `Mark ${repo.name} for research and add short notes on why it matters.`,
        true
      );
  };

  const handleSimilar = (repo: Repo) => {
       logger.logEvent({
          type: 'tool.call',
          house_id: 'git-stars',
          timestamp: new Date().toISOString(),
          tool_name: 'find_similar_repos',
          tool_id: `mock-${Date.now()}`,
          arguments: { name: repo.name }
      });
      openReadmeWithAction(
        repo,
        `Find similar repos to ${repo.name} and explain why they match.`,
        true
      );
  };

  const handleChat = (repo: Repo) => {
    openReadmeWithAction(repo);
  };

  const repoKey = (repo: Repo) => `${repo.author}/${repo.name}`;

  const recordHistory = (repo: Repo) => {
    setHistory((prev) => {
      const filtered = prev.filter((r) => repoKey(r) !== repoKey(repo));
      return [repo, ...filtered].slice(0, 50);
    });
  };

  const isBookmarked = (repo: Repo) => bookmarks.some((r) => repoKey(r) === repoKey(repo));

  const toggleBookmark = (repo: Repo) => {
    setBookmarks((prev) => {
      const exists = prev.some((r) => repoKey(r) === repoKey(repo));
      if (exists) {
        return prev.filter((r) => repoKey(r) !== repoKey(repo));
      }
      return [repo, ...prev];
    });
  };

  const handleContextMenu = (event: MouseEvent, repo: Repo) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, repo });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close);
    };
  }, [contextMenu]);
 
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [mineSearchTerm, setMineSearchTerm] = useState('');
  const [mineVisibility, setMineVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [mineDateRange, setMineDateRange] = useState<'all' | '7d' | '30d' | '90d' | '180d' | '365d'>('all');


  useEffect(() => {
    fetch('/data.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => {

        const flat = jsonData.flatMap((g: LanguageGroup) => g.repos || []);
        setAllRepos(flat);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('git-stars:bookmarks');
      if (stored) setBookmarks(JSON.parse(stored));
      const storedHistory = localStorage.getItem('git-stars:history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      const storedMine = localStorage.getItem('git-stars:my-repos');
      if (storedMine) setMyRepos(JSON.parse(storedMine));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('git-stars:bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('git-stars:history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('git-stars:my-repos', JSON.stringify(myRepos));
    } catch {
      // ignore
    }
  }, [myRepos]);

  useEffect(() => {
    const tryFetch = async (paths: string[]) => {
      for (const path of paths) {
        try {
          const res = await fetch(path);
          if (!res.ok) continue;
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMyRepos(data);
            return;
          }
        } catch {
          // ignore and continue
        }
      }
    };
    tryFetch(['/my-repos.json', '/data/my-repos.json', '/data/owned-repos.json']);
  }, []);

  // Extract unique values for filters
  const languages = useMemo(() => {
    const set = new Set<string>();
    allRepos.forEach((r) => r.languages?.forEach((l) => set.add(l.language)));
    return Array.from(set).sort();
  }, [allRepos]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    allRepos.forEach((r) => r.topics?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allRepos]);

  // Filter and Sort Logic
  const processedRepos = useMemo(() => {
    let filtered = allRepos.filter((repo) => {
      const matchSearch =
        !searchTerm ||
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchLang =
        selectedLanguage === 'all' ||
        repo.languages?.some((l) => l.language === selectedLanguage);

      const matchTag = selectedTag === 'all' || repo.topics?.includes(selectedTag);

      return matchSearch && matchLang && matchTag;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          // Assuming 'date' field exists on repo object in data.json equivalent to legacy 'date'
          return new Date((b as any).date || 0).getTime() - new Date((a as any).date || 0).getTime();
        case 'created':
           // Legacy mapped 'created' to 'last_updated'
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        case 'language':
          return (a.languages?.[0]?.language || '').localeCompare(b.languages?.[0]?.language || '');
        case 'tag':
          return (a.topics?.[0] || '').localeCompare(b.topics?.[0] || '');
        default:
          return 0;
      }
    });
  }, [
    allRepos,
    searchTerm,
    selectedLanguage,
    selectedTag,
    sortBy,
  ]);

  const ownedRepos = useMemo(() => myRepos.filter((repo) => repo.is_owner !== false), [myRepos]);

  const processedMineRepos = useMemo(() => {
    const rangeMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365,
    };
    const days = rangeMap[mineDateRange] || 0;
    const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;

    return ownedRepos.filter((repo) => {
      const matchSearch =
        !mineSearchTerm ||
        repo.name.toLowerCase().includes(mineSearchTerm.toLowerCase()) ||
        (repo.description || '').toLowerCase().includes(mineSearchTerm.toLowerCase());

      const matchVisibility =
        mineVisibility === 'all' ||
        (mineVisibility === 'private' ? !!repo.private : !repo.private);

      let matchDate = true;
      if (cutoff) {
        const dateValue = repo.last_updated_at || repo.last_updated || repo.date || '';
        const parsed = Date.parse(dateValue);
        matchDate = Number.isFinite(parsed) ? parsed >= cutoff : true;
      }

      return matchSearch && matchVisibility && matchDate;
    });
  }, [ownedRepos, mineSearchTerm, mineVisibility, mineDateRange]);

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-message" style={{ margin: '20px', padding: '20px', background: '#fee', color: 'red' }}>
          Error loading data: {error}
        </div>
      </div>
    );
  }

   return (
    <>
      <header className="main-header">
        <a href="/" className="header-brand" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>
           <Github size={28} />
           <span>GitStars</span>
        </a>

        <div className="nav-capsule">
            <button 
              onClick={() => setView('cards')} 
              className={`nav-item ${view === 'cards' ? 'active' : ''}`}
            >
              <LayoutGrid size={16} /> Cards
            </button>
            <button 
              onClick={() => setView('table')} 
              className={`nav-item ${view === 'table' ? 'active' : ''}`}
            >
              <TableIcon size={16} /> Table
            </button>
             <button 
              onClick={() => setView('statistics')} 
              className={`nav-item ${view === 'statistics' ? 'active' : ''}`}
            >
              <BarChart3 size={16} /> Stats
            </button>
            <button 
              onClick={() => setView('activity')} 
              className={`nav-item ${view === 'activity' ? 'active' : ''}`}
            >
              <Activity size={16} /> Activity
            </button>
            <button
              onClick={() => setView('news')}
              className={`nav-item ${view === 'news' ? 'active' : ''}`}
            >
              <Compass size={16} /> News
            </button>
            <button
              onClick={() => setView('mine')}
              className={`nav-item ${view === 'mine' ? 'active' : ''}`}
            >
              <User size={16} /> Mine
            </button>
        </div>

        <div className="header-stats">
            <div className="stat-badge" title="Total Stars">
               <Star size={14} fill="currentColor" className="text-muted" /> 
               {view === 'mine' ? processedMineRepos.length : processedRepos.length} Repos
            </div>
        </div>
      </header>

      {view !== 'statistics' && view !== 'activity' && view !== 'news' && (
        <div className="filters-container">
           {view === 'mine' ? (
             <>
               <div className="filter-input-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search my repos..."
                    value={mineSearchTerm}
                    onChange={(e) => setMineSearchTerm(e.target.value)}
                  />
               </div>
               <div className="filter-group" style={{ display: 'flex', gap: 12 }}>
                 <select className="filter-select" value={mineVisibility} onChange={(e) => setMineVisibility(e.target.value as typeof mineVisibility)}>
                   <option value="all">Visibility: All</option>
                   <option value="public">Public only</option>
                   <option value="private">Private only</option>
                 </select>
                 <select className="filter-select" value={mineDateRange} onChange={(e) => setMineDateRange(e.target.value as typeof mineDateRange)}>
                   <option value="all">Updated: Any time</option>
                   <option value="7d">Updated: 7 days</option>
                   <option value="30d">Updated: 30 days</option>
                   <option value="90d">Updated: 90 days</option>
                   <option value="180d">Updated: 6 months</option>
                   <option value="365d">Updated: 1 year</option>
                 </select>
               </div>
             </>
           ) : (
             <>
               <div className="filter-input-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="filter-group" style={{ display: 'flex', gap: 12 }}>
                 <select className="filter-select" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                   <option value="all">All Languages</option>
                   {languages.map(l => <option key={l} value={l}>{l}</option>)}
                 </select>

                 <select className="filter-select" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
                    <option value="all">All Tags</option>
                    {tags.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>

                 <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Sort: Name</option>
                    <option value="date">Sort: Date Starred</option>
                    <option value="created">Sort: Recently Updated</option>
                    <option value="language">Sort: Language</option>
                 </select>
               </div>
             </>
           )}
        </div>
      )}

      <div className="primary-view">
        {view === 'statistics' ? (
          <Statistics starredRepos={allRepos} myRepos={myRepos} />
        ) : view === 'news' ? (
          <HighlightsPanel repos={allRepos} bookmarks={bookmarks} history={history} onSelectRepo={handleRepoClick} />
        ) : view === 'mine' ? (
        <MyReposPanel
          myRepos={processedMineRepos}
          renderRepoCard={(repo) => (
            <RepoCard 
              key={`${repo.author}-${repo.name}`}
              repo={repo} 
                onClick={handleRepoClick}
                onChat={handleChat}
                onResearch={handleResearch}
                onSimilar={handleSimilar}
                onContextMenu={handleContextMenu}
                onBookmark={toggleBookmark}
                isBookmarked={isBookmarked(repo)}
              />
            )}
          />
        ) : view === 'activity' ? (
          <ActivityLog />
        ) : (
          <div id="reposContainer" className={view === 'cards' ? 'repos-grid' : 'repo-table-container'}>
            {view === 'cards' ? (
               processedRepos.map((repo, idx) => (
                 <RepoCard 
                    key={`${repo.author}-${repo.name}-${idx}`} 
                    repo={repo} 
                    onClick={handleRepoClick}
                    onChat={handleChat}
                    onResearch={handleResearch}
                    onSimilar={handleSimilar}
                    onContextMenu={handleContextMenu}
                    onBookmark={toggleBookmark}
                    isBookmarked={isBookmarked(repo)}
                 />
               ))
            ) : (
              <RepoTable repos={processedRepos} onRowClick={handleRepoClick} />
            )}
          </div>
        )}
      </div>

      <ReadmePanel 
        isOpen={isReadmeOpen} 
        onClose={() => setIsReadmeOpen(false)} 
        repo={selectedRepo} 
        actionPrompt={readmeAction || undefined}
        autoRunAction={readmeAutoRun}
        onActionConsumed={() => {
          setReadmeAction(null);
          setReadmeAutoRun(false);
        }}
        actionPresets={view === 'mine' ? [
          { label: 'Template', prompt: 'Create a production-ready repo template for this project (folders, configs, CI, docs).', title: 'Template', variant: 'primary' },
          { label: 'Packages update', prompt: 'Review dependencies and propose an update plan with exact commands.', title: 'Packages update' },
          { label: 'Mission: Codex', prompt: 'Draft a mission brief for Codex to implement the next steps. Include files, tasks, and tests.', title: 'Mission: Codex' },
          { label: 'Mission: Jules', prompt: 'Draft a mission brief for Google Jules to refactor or modernize this repo. Include tasks and risk notes.', title: 'Mission: Jules' },
          { label: 'Contribution plan', prompt: 'Outline a contribution plan aligned with HTDI houses.', title: 'Contribution plan' },
          { label: 'House integration', prompt: 'Suggest how to integrate this repo into a house workflow.', title: 'House integration' },
        ] : undefined}
      />

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { openReadmeWithAction(contextMenu.repo); setContextMenu(null); }}>
            Open readme + actions
          </button>
          <button onClick={() => { openReadmeWithAction(contextMenu.repo, 'Summarize this repo and its risks.', true); setContextMenu(null); }}>
            Instant summary
          </button>
          <button onClick={() => { openReadmeWithAction(contextMenu.repo, `Find similar repos to ${contextMenu.repo.name}.`, true); setContextMenu(null); }}>
            Find similar
          </button>
          <button onClick={() => { openReadmeWithAction(contextMenu.repo, `Mark ${contextMenu.repo.name} for research with notes.`, true); setContextMenu(null); }}>
            Queue research
          </button>
        </div>
      )}
    </>
  );
}

export default App;

import { useState, useEffect, useMemo } from 'react';
import { LanguageGroup, Repo } from './types';
import { RepoCard } from './components/RepoCard';
import { RepoTable } from './components/RepoTable';
import { ReadmePanel } from './components/ReadmePanel';
import { Statistics } from './components/Statistics';
import { Search, Github, LayoutGrid, Table as TableIcon, BarChart3, Star } from 'lucide-react';

function App() {
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'table' | 'statistics'>('cards');
  
  // Readme Panel State
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);

  const handleRepoClick = (repo: Repo) => {
    setSelectedRepo(repo);
    setIsReadmeOpen(true);
  };
 
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedLicense, setSelectedLicense] = useState('all');
  const [sortBy, setSortBy] = useState('name');


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

  const licenses = useMemo(() => {
    // Note: data.json might not have 'license' field on all repos explicitly based on types,
    // but legacy code used it. We cast to any to safely access potentially missing fields for now
    // or assume it's there if the data has it.
    const set = new Set<string>();
    allRepos.forEach((r: any) => {
      if (r.license) set.add(r.license);
    });
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

      // Cast to any for license check if not in type
      const matchLic =
        selectedLicense === 'all' || (repo as any).license === selectedLicense;

      return matchSearch && matchLang && matchTag && matchLic;
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
    selectedLicense,
    sortBy,
  ]);

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
        <div className="left-group capsule">
          <a href="/" className="home-link" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>
             <Github className="f-icon" />
            <span className="title">GitStars</span>
          </a>
        </div>
        <div className="center-group capsule" style={{ display: 'flex', gap: '5px', padding: '4px', background: 'rgba(255,255,255,0.9)', borderRadius: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={() => setView('cards')} 
              className={view === 'cards' ? 'nav-active' : ''}
              style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', background: view === 'cards' ? '#2563eb' : 'transparent', color: view === 'cards' ? 'white' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s' }}
            >
              <LayoutGrid size={16} /> Cards
            </button>
            <button 
              onClick={() => setView('table')} 
              className={view === 'table' ? 'nav-active' : ''}
              style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', background: view === 'table' ? '#2563eb' : 'transparent', color: view === 'table' ? 'white' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s' }}
            >
              <TableIcon size={16} /> Table
            </button>
             <button 
              onClick={() => setView('statistics')} 
              className={view === 'statistics' ? 'nav-active' : ''}
              style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', background: view === 'statistics' ? '#2563eb' : 'transparent', color: view === 'statistics' ? 'white' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, transition: 'all 0.2s' }}
            >
              <BarChart3 size={16} /> Statistics
            </button>
        </div>
        <div className="right-group">
            <div className="logs-container" title="Total Stars">
               <span id="starCount" className="badge" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Star size={16} fill="#fbbf24" stroke="#fbbf24" /> {processedRepos.length}
               </span>
            </div>
        </div>
      </header>

      {view !== 'statistics' && (
        <div className="filters">
           <div className="filter-item">
              <Search size={18} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="filter-item">
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                 <option value="all">All Languages</option>
                 {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
           </div>
           <div className="filter-item">
              <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
                 <option value="all">All Tags</option>
                 {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
           <div className="filter-item">
              <select value={selectedLicense} onChange={(e) => setSelectedLicense(e.target.value)}>
                 <option value="all">All Licenses</option>
                 {licenses.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
           </div>
           <div className="filter-item">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                 <option value="name">Name</option>
                 <option value="date">Date Starred</option>
                 <option value="created">Last Updated</option>
                 <option value="language">Language</option>
                 <option value="tag">Tag</option>
              </select>
           </div>
        </div>
      )}

      {view === 'statistics' ? (
        <Statistics repos={allRepos} />
      ) : (
        <div id="reposContainer" className={view === 'cards' ? 'view-cards' : 'view-table'}>
          {view === 'cards' ? (
             processedRepos.map((repo, idx) => (
               <RepoCard 
                  key={`${repo.author}-${repo.name}-${idx}`} 
                  repo={repo} 
                  onClick={handleRepoClick}
               />
             ))
          ) : (
            <RepoTable repos={processedRepos} />
          )}
        </div>
      )}

      
      <ReadmePanel 
        isOpen={isReadmeOpen} 
        onClose={() => setIsReadmeOpen(false)} 
        repo={selectedRepo} 
      />
    </>
  );
}

export default App;

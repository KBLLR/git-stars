import { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ExternalLink, X } from 'lucide-react';
import { Repo } from '../types';

interface ReadmePanelProps {
  isOpen: boolean;
  onClose: () => void;
  repo: Repo | null;
}

export function ReadmePanel({ isOpen, onClose, repo }: ReadmePanelProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && repo) {
      setLoading(true);
      setContent('');
      
      const tryFetch = (branch: string) =>
        fetch(`https://raw.githubusercontent.com/${repo.author}/${repo.name}/${branch}/README.md`)
          .then((r) => (r.ok ? r.text() : ''));

      tryFetch('master')
        .then((text) => text || tryFetch('main'))
        .then(async (text) => {
          if (text) {
            const html = await marked.parse(text);
            setContent(DOMPurify.sanitize(html));
          } else {
            setContent('README not found');
          }
        })
        .catch(() => {
          setContent('Failed to load README');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, repo]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('panel-open');
    } else {
      document.body.classList.remove('panel-open');
    }
  }, [isOpen]);

  return (
    <div className={`readme-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <div style={{ display: 'flex', gap: '10px' }}>
            <button className="close-btn" onClick={onClose} style={{ position: 'static', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
               <X size={24} />
            </button>
            {repo && (
               <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#2563eb', fontWeight: 'bold' }}>
                  Visit Repo <ExternalLink size={16} />
               </a>
            )}
         </div>
      </div>
      <div className="readme-content">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ExternalLink, X, Sparkles, Wand2 } from 'lucide-react';
import { Repo } from '../types';
import { streamOpenResponses } from '../lib/openresponses-client';
import { buildGitStarsTools, buildSystemPrompt, EVENT_BUS_URL } from '../lib/orchestrator';

interface ReadmePanelProps {
  isOpen: boolean;
  onClose: () => void;
  repo: Repo | null;
  actionPrompt?: string;
  autoRunAction?: boolean;
  onActionConsumed?: () => void;
  actionPresets?: { label: string; prompt: string; title?: string; variant?: 'primary' | 'default' }[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ReadmePanel({ isOpen, onClose, repo, actionPrompt, autoRunAction, onActionConsumed, actionPresets }: ReadmePanelProps) {
  const [content, setContent] = useState<string>('');
  const [rawMarkdown, setRawMarkdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('local-model');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlayContent, setOverlayContent] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const lastActionRef = useRef<string | null>(null);
  const streamRef = useRef<AbortController | null>(null);

  const defaultActions = [
    { label: 'Extract skills', prompt: 'Extract skills from this repository and list required capabilities.', title: 'Extract skills' },
    { label: 'Ecosystem relevancy', prompt: 'Explain relevancy of this repository within our ecosystem.', title: 'Ecosystem relevancy' },
    { label: 'How to contribute', prompt: 'Explain how to contribute and where to start.', title: 'How to contribute' },
    { label: 'Clone into houses/', prompt: 'Suggest how to clone or integrate this repo into houses/ with a plan.', title: 'Clone into houses' },
    { label: 'Tactical summary', prompt: 'Provide a short tactical summary and recommended next actions.', title: 'Tactical summary', variant: 'primary' },
  ];

  const actions = actionPresets && actionPresets.length > 0 ? actionPresets : defaultActions;

  const renderMarkdown = async (text: string) => {
    try {
      const html = await marked.parse(text);
      setContent(DOMPurify.sanitize(html));
    } catch (error) {
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      setContent(`<pre>${escaped}</pre>`);
    }
  };

  const getReadmeExcerpt = () => {
    if (!rawMarkdown) return '';
    return rawMarkdown.slice(0, 4000);
  };

  const buildConversation = (prompt: string) => {
    const excerpt = getReadmeExcerpt();
    const systemPrompt = `${buildSystemPrompt(repo)}\n\nREADME excerpt:\n${excerpt || 'No README loaded.'}`;
    return [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt },
    ];
  };

  const runAction = (prompt: string, title?: string) => {
    if (!repo) return;
    const actionTitle = title || 'Action';
    const actionId = `action-${Date.now()}`;
    setOverlayTitle(actionTitle);
    setOverlayContent('');
    setOverlayVisible(true);
    setIsRunning(true);

    const userMessage: ChatMessage = { id: `${actionId}-user`, role: 'user', content: prompt };
    const assistantMessage: ChatMessage = { id: `${actionId}-assistant`, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    streamRef.current?.abort();
    streamRef.current = streamOpenResponses({
      endpoint: `${EVENT_BUS_URL}/chat`,
      body: {
        model: selectedModel || 'local-model',
        messages: buildConversation(prompt),
        tools: buildGitStarsTools(),
        tool_choice: 'auto',
        agent_id: 'git-stars:orchestrator',
        house_id: 'git-stars',
      },
      onEvent: (event) => {
        if (event.type === 'response.output_text.delta' && event.delta) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: m.content + event.delta } : m
            )
          );
          setOverlayContent((prev) => prev + event.delta);
        }
      },
      onComplete: () => {
        setIsRunning(false);
      },
      onError: (error) => {
        setIsRunning(false);
        setOverlayContent(`Error: ${error.message}`);
      },
    });
  };

  useEffect(() => {
    if (isOpen && repo) {
      setLoading(true);
      setContent('');
      setRawMarkdown('');
      setMessages([]);
      
      const tryFetch = (branch: string) =>
        fetch(`https://raw.githubusercontent.com/${repo.author}/${repo.name}/${branch}/README.md`)
          .then((r) => (r.ok ? r.text() : ''));

      tryFetch('master')
        .then((text) => text || tryFetch('main'))
        .then(async (text) => {
          if (text) {
            setRawMarkdown(text);
            await renderMarkdown(text);
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
    if (!isOpen) return;
    fetch(`${EVENT_BUS_URL}/models?task_kind=llm`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.models)
            ? data.models
            : Array.isArray(data?.data)
              ? data.data
              : [];
        const normalized = list
          .map((m: any) => (typeof m === 'string' ? m : m?.id || m?.model))
          .filter(Boolean);
        if (normalized.length > 0) {
          setModels(normalized);
          setSelectedModel((prev) => (normalized.includes(prev) ? prev : normalized[0]));
        }
      })
      .catch(() => null);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('panel-open');
    } else {
      document.body.classList.remove('panel-open');
      setOverlayVisible(false);
      setOverlayContent('');
      setOverlayTitle('');
      setIsRunning(false);
      streamRef.current?.abort();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !repo || !actionPrompt || !autoRunAction) return;
    if (lastActionRef.current === actionPrompt) return;
    lastActionRef.current = actionPrompt;
    runAction(actionPrompt, 'Quick action');
    onActionConsumed?.();
  }, [isOpen, repo, actionPrompt, autoRunAction, onActionConsumed]);

  return (
    <div className={`readme-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
         <div className="readme-header-left">
            <button className="close-btn" onClick={onClose}>
               <X size={20} />
            </button>
            {repo && (
               <a href={repo.url} target="_blank" rel="noopener noreferrer" className="readme-repo-link">
                  Visit Repo <ExternalLink size={16} />
               </a>
            )}
         </div>
         <div className="readme-header-right">
           <span>Model</span>
           <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
             {(models.length > 0 ? models : ['local-model']).map((model) => (
               <option key={model} value={model}>{model}</option>
             ))}
           </select>
         </div>
      </div>
      <div className="readme-actions-header">
        {actions.map((action) => (
          <button
            key={action.label}
            className={`action-btn ${action.variant === 'primary' ? 'primary' : ''}`}
            onClick={() => runAction(action.prompt, action.title || action.label)}
          >
            {action.variant === 'primary' ? <Wand2 size={14} /> : <Sparkles size={14} />} {action.label}
          </button>
        ))}
      </div>
      <div className="readme-content">
        <div className="readme-frame">
          <div className="readme-scroll">
            {loading ? <p>Loading...</p> : <div dangerouslySetInnerHTML={{ __html: content }} />}
          </div>
          {overlayVisible && (
            <div className="readme-overlay">
              <div className="readme-overlay-card">
                <div className="readme-overlay-title">{overlayTitle}</div>
                <div className="readme-overlay-body">
                  {overlayContent || (isRunning ? 'Working...' : 'Ready')}
                </div>
                {!isRunning && (
                  <button className="action-btn" onClick={() => setOverlayVisible(false)}>
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="readme-chat">
          <div className="readme-chat-log">
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
          </div>
          <div className="readme-chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this repo..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim()) {
                  runAction(input.trim(), 'Custom request');
                  setInput('');
                }
              }}
            />
            <button
              className="action-btn"
              onClick={() => {
                if (!input.trim()) return;
                runAction(input.trim(), 'Custom request');
                setInput('');
              }}
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

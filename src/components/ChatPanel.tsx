import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, Bot, User as UserIcon, Loader, Wrench } from 'lucide-react';
import { Repo } from '../types';
import {
  buildGitStarsTools,
  buildSystemPrompt,
  DEFAULT_AGENT_ID,
  EVENT_BUS_URL,
  HOUSE_ID,
} from '../lib/orchestrator';
import { OpenResponsesEvent, streamOpenResponses } from '../lib/openresponses-client';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  repo: Repo | null;
  agentId?: string;
  prefill?: string;
  autoSend?: boolean;
  onPrefillConsumed?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: string;
  status: 'in_progress' | 'done';
}

export function ChatPanel({
  isOpen,
  onClose,
  repo,
  agentId = DEFAULT_AGENT_ID,
  prefill,
  autoSend = false,
  onPrefillConsumed,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<Record<string, ToolCall>>({});
  const [defaultModel, setDefaultModel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<AbortController | null>(null);
  const lastPrefillRef = useRef<string | null>(null);

  const tools = useMemo(() => buildGitStarsTools(), []);

  useEffect(() => {
    fetch(`${EVENT_BUS_URL}/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((settings) => {
        if (settings?.models?.default_model) {
          setDefaultModel(settings.models.default_model);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (isOpen && repo) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Git Stars Orchestrator online. I can analyze **${repo.name}** or scan your wider star field.`,
          timestamp: Date.now(),
        },
      ]);
      setToolCalls({});
    }
  }, [isOpen, repo]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, toolCalls]);

  useEffect(() => {
    if (!isOpen) return;
    if (!prefill) return;
    if (lastPrefillRef.current === prefill) return;

    lastPrefillRef.current = prefill;
    setInput(prefill);
    if (autoSend) {
      handleSend(prefill);
      onPrefillConsumed?.();
    }
  }, [isOpen, prefill, autoSend, onPrefillConsumed]);

  const handleClose = () => {
    streamRef.current?.abort();
    streamRef.current = null;
    onClose();
  };

  const handleSend = async (override?: string) => {
    if (!repo) return;
    const content = (override ?? input).trim();
    if (!content) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);
    setInput('');
    setIsLoading(true);

    const conversation = [
      { role: 'system', content: buildSystemPrompt(repo) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content },
    ];

    streamRef.current?.abort();

    streamRef.current = streamOpenResponses({
      endpoint: `${EVENT_BUS_URL}/chat`,
      body: {
        model: defaultModel || 'local-model',
        messages: conversation,
        agent_id: agentId,
        house_id: HOUSE_ID,
        tools,
        tool_choice: 'auto',
      },
      onEvent: (event: OpenResponsesEvent) => {
        handleStreamEvent(event, assistantId);
      },
      onComplete: () => {
        setIsLoading(false);
      },
      onError: (error) => {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Tooling error: ${error.message}`,
            timestamp: Date.now(),
          },
        ]);
      },
    });
  };

  const handleStreamEvent = (event: OpenResponsesEvent, assistantId: string) => {
    if (event.type === 'response.output_text.delta' && event.delta) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: msg.content + event.delta }
            : msg
        )
      );
      return;
    }

    if (event.type === 'response.output_item.added' && event.item?.type === 'function_call') {
      const callId = event.item.call_id || event.item_id || `call-${Date.now()}`;
      setToolCalls((prev) => ({
        ...prev,
        [callId]: {
          id: callId,
          name: event.item?.name || 'tool',
          arguments: event.item?.arguments || '',
          status: 'in_progress',
        },
      }));
      return;
    }

    if (event.type === 'response.function_call_arguments.delta') {
      const callId = event.call_id || event.item_id;
      if (!callId || !event.delta) return;
      setToolCalls((prev) => {
        const existing = prev[callId] || {
          id: callId,
          name: 'tool',
          arguments: '',
          status: 'in_progress',
        };
        return {
          ...prev,
          [callId]: {
            ...existing,
            arguments: `${existing.arguments}${event.delta}`,
          },
        };
      });
      return;
    }

    if (event.type === 'response.output_item.done' && event.item?.type === 'function_call') {
      const callId = event.item.call_id || event.item_id;
      if (!callId) return;
      setToolCalls((prev) => ({
        ...prev,
        [callId]: {
          ...prev[callId],
          status: 'done',
        },
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="orchestrator-panel">
      <div className="orchestrator-header">
        <div className="orchestrator-title">
          <div className="orchestrator-icon">
            <Bot size={18} />
          </div>
          <div>
            <div className="orchestrator-name">Orchestrator</div>
            <div className="orchestrator-sub">{repo ? `${repo.author}/${repo.name}` : 'No repo selected'}</div>
          </div>
        </div>
        <button onClick={handleClose} className="orchestrator-close">
          <X size={18} />
        </button>
      </div>

      <div className="orchestrator-actions">
        <button className="chip chip-tag" onClick={() => handleSend('Summarize this repo and its risks.')}>Summary</button>
        <button className="chip chip-tag" onClick={() => handleSend('Find similar repositories and explain why.')}>Similar</button>
        <button className="chip chip-tag" onClick={() => handleSend('List the key topics and how active they are.')}>Topics</button>
        <button className="chip chip-tag" onClick={() => handleSend('Mark this repo for research with notes on why it matters.')}>Queue</button>
      </div>

      <div ref={scrollRef} className="orchestrator-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? <Bot size={16} /> : <UserIcon size={16} />}
            </div>
            <div className="message-bubble">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-row assistant">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-bubble loading">
              <Loader size={14} className="spin" /> Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="orchestrator-tools">
        <div className="tools-header">
          <Wrench size={14} /> Tool activity
        </div>
        <div className="tools-list">
          {Object.values(toolCalls).length === 0 ? (
            <div className="tool-empty">No tool calls yet.</div>
          ) : (
            Object.values(toolCalls).map((call) => (
              <div key={call.id} className="tool-item">
                <div className="tool-name">
                  {call.name}
                  <span className={`tool-status ${call.status}`}>{call.status}</span>
                </div>
                <div className="tool-args">{call.arguments || '...'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="orchestrator-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the orchestrator..."
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

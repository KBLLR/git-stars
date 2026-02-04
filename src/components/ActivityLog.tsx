import React, { useEffect, useState } from 'react';
import { AgentEvent, getEventHouseId } from '@agent-events';
import { logger } from '../lib/logger';
import { Download, Activity, Server, Database } from 'lucide-react';

const EVENT_BUS_SSE_URL = 'http://localhost:8085/events';

 export const ActivityLog: React.FC = () => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Load initial cache
    setEvents(logger.getCachedEvents());

    // 2. Subscribe to Event Bus SSE
    const eventSource = new EventSource(EVENT_BUS_SSE_URL);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Connected to Event Bus SSE');
    };

    eventSource.onmessage = (message) => {
        try {
            const event: AgentEvent = JSON.parse(message.data);
            setEvents(prev => [event, ...prev.slice(0, 199)]); // Keep last 200
            // Also update local cache for offline persistence
            logger.saveToLocalCache(event);
        } catch(e) {
            console.error('Failed to parse SSE event', e);
        }
    };

    eventSource.onerror = (e) => {
        console.warn('Event Bus SSE Error (likely offline or reconnecting)', e);
        setIsConnected(false);
    }

    return () => {
      eventSource.close();
    };
  }, []);

  const filteredEvents = events.filter(e => 
    filterType === 'all' || e.type === filterType || (filterType === 'git-stars' && e.type.startsWith('git-stars:'))
  );

  const downloadJson = () => {
    const jsonString = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `git-stars-activity-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventIcon = (type: string) => {
      if (type.startsWith('git-stars')) return <Activity size={16} className="text-blue-500"/>
      if (type.startsWith('response')) return <Server size={16} className="text-purple-500"/>
      if (type.startsWith('tool')) return <Database size={16} className="text-orange-500"/>
      return <Activity size={16} className="text-gray-400"/>
  }

  return (
    <div className="activity-container">
      <div className="activity-header">
        <div>
            <h2 className="stats-header" style={{ marginBottom: 0 }}>
                Activity Stream
                {isConnected ? 
                    <span className="status-badge live">Live</span> : 
                    <span className="status-badge offline">Cached (Offline)</span>
                }
            </h2>
            <p className="text-muted">Real-time events from the git-stars orchestrator & ecosystem</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
             <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
            >
                <option value="all">All Events</option>
                <option value="git-stars">Git Stars Custom</option>
                <option value="response.completed">Response Completed</option>
                <option value="tool.call">Tool Calls</option>
            </select>
            <button 
                onClick={downloadJson}
                className="action-btn"
                style={{ padding: '0 16px' }}
            >
                <Download size={16} /> Export JSON
            </button>
        </div>
      </div>

      <div className="activity-table-wrapper">
        <table className="activity-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>House</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                {filteredEvents.length === 0 ? (
                    <tr>
                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                            No events found. Stream is waiting for emissions.
                        </td>
                    </tr>
                ) : (
                    filteredEvents.map((event, idx) => (
                        <tr key={idx}>
                            <td style={{ fontFamily: 'monospace' }} className="text-muted">
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </td>
                            <td style={{ fontWeight: 500 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {getEventIcon(event.type)}
                                    {event.type}
                                </div>
                            </td>
                            <td>
                                <span className="chip chip-tag">
                                    {getEventHouseId(event)}
                                </span>
                            </td>
                            <td className="text-muted" style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {'data' in event ? JSON.stringify((event as any).data) 
                                 : 'tool_name' in event ? `Call: ${(event as any).tool_name}`
                                 : 'response_id' in event ? `Resp: ${(event as any).response_id}` 
                                 : JSON.stringify(event)}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

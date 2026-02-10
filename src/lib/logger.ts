import { AgentEvent, createCustomEvent, HouseId } from '@agent-events';
import { Repo } from '../types';

const EVENT_BUS_URL = import.meta.env.VITE_EVENT_BUS_URL || '/bus';
const HOUSE_ID: HouseId = 'git-stars';

// Standard event types for this house
const REPO_VIEWED_TYPE = 'repo.viewed';

interface RepoViewDetails {
  nwo: string; // name with owner
  url: string;
  source: 'card' | 'table';
}

/**
 * Logger service that emits to the central Event Bus
 * and optionally caches locally for offline support.
 */
export const logger = {
  /**
   * Log an event to the Event Bus (Authoritative Source)
   */
  async logEvent(event: AgentEvent) {
    try {
      // 1. Emit to Event Bus
      await fetch(`${EVENT_BUS_URL}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('Failed to emit event to Event Bus:', error);
      // Fallback: Store locally (offline mode)
      this.saveToLocalCache(event);
    }
  },

  /**
   * Save to local storage as a cache/fallback
   */
  saveToLocalCache(event: AgentEvent) {
    try {
      const stored = localStorage.getItem('git-stars:activity-cache');
      const events: AgentEvent[] = stored ? JSON.parse(stored) : [];
      events.unshift(event); // Newest first
      // Keep only last 100 for cache
      if (events.length > 100) events.length = 100;
      localStorage.setItem('git-stars:activity-cache', JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save to local cache', e);
    }
  },

  /**
   * Factory: Create a 'repo.viewed' custom event
   */
  createRepoViewEvent(repo: Repo, source: 'card' | 'table'): AgentEvent {
    const details: RepoViewDetails = {
      nwo: `${repo.author}/${repo.name}`,
      url: repo.url,
      source
    };
    return createCustomEvent(HOUSE_ID, REPO_VIEWED_TYPE, details);
  },

  /**
   * Get events for initial view (merges local cache in case of offline)
   * Real-time updates should come from SSE.
   */
  getCachedEvents(): AgentEvent[] {
    try {
      const stored = localStorage.getItem('git-stars:activity-cache');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
};

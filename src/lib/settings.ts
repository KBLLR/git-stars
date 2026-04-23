import { EVENT_BUS_URL } from './orchestrator';

export type RuntimeMode = 'local' | 'web';

export interface RuntimeSettings {
  mode: RuntimeMode;
  localModel: string;
  webModel: string;
  localBusUrl: string;
  webBusUrl: string;
}

export const SETTINGS_STORAGE_KEY = 'git-stars:runtime-settings';
export const SETTINGS_EVENT = 'git-stars:settings-changed';

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  mode: 'local',
  localModel: 'local-model',
  webModel: 'gemini-2.5-flash',
  localBusUrl: EVENT_BUS_URL,
  webBusUrl: EVENT_BUS_URL,
};

function normalizeBusUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return EVENT_BUS_URL;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function loadRuntimeSettings(): RuntimeSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_RUNTIME_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_RUNTIME_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<RuntimeSettings>;
    return {
      mode: parsed.mode === 'web' ? 'web' : 'local',
      localModel: parsed.localModel || DEFAULT_RUNTIME_SETTINGS.localModel,
      webModel: parsed.webModel || DEFAULT_RUNTIME_SETTINGS.webModel,
      localBusUrl: normalizeBusUrl(parsed.localBusUrl || DEFAULT_RUNTIME_SETTINGS.localBusUrl),
      webBusUrl: normalizeBusUrl(parsed.webBusUrl || DEFAULT_RUNTIME_SETTINGS.webBusUrl),
    };
  } catch {
    return DEFAULT_RUNTIME_SETTINGS;
  }
}

export function saveRuntimeSettings(settings: RuntimeSettings) {
  if (typeof window === 'undefined') return;
  const normalized: RuntimeSettings = {
    mode: settings.mode,
    localModel: settings.localModel.trim() || DEFAULT_RUNTIME_SETTINGS.localModel,
    webModel: settings.webModel.trim() || DEFAULT_RUNTIME_SETTINGS.webModel,
    localBusUrl: normalizeBusUrl(settings.localBusUrl),
    webBusUrl: normalizeBusUrl(settings.webBusUrl),
  };
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: normalized }));
}

export function resolveRuntimeTarget(settings: RuntimeSettings) {
  const isWeb = settings.mode === 'web';
  const busUrl = isWeb ? settings.webBusUrl : settings.localBusUrl;
  return {
    busUrl,
    model: isWeb ? settings.webModel : settings.localModel,
    mode: settings.mode,
  };
}

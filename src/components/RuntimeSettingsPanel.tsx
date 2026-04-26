import { useEffect, useState } from 'react';
import { Activity, Settings2 } from 'lucide-react';
import {
  DEFAULT_RUNTIME_SETTINGS,
  RuntimeMode,
  RuntimeSettings,
  loadRuntimeSettings,
  saveRuntimeSettings,
} from '../lib/settings';

export function RuntimeSettingsPanel() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RuntimeSettings>(DEFAULT_RUNTIME_SETTINGS);
  const [health, setHealth] = useState<{ status: 'checking' | 'live' | 'offline'; detail: string; model?: string }>({
    status: 'checking',
    detail: 'Checking OpenResponses bus',
  });

  useEffect(() => {
    setDraft(loadRuntimeSettings());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const target = draft.mode === 'web' ? draft.webBusUrl : draft.localBusUrl;

    setHealth({ status: 'checking', detail: 'Checking OpenResponses bus' });
    fetch(`${target}/settings`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((settings) => {
        if (cancelled) return;
        const defaultModel =
          settings
          && typeof settings === 'object'
          && 'models' in settings
          && settings.models
          && typeof settings.models === 'object'
          && 'default_model' in settings.models
          && typeof settings.models.default_model === 'string'
            ? settings.models.default_model
            : undefined;
        setHealth({
          status: 'live',
          detail: draft.mode === 'local' ? 'Local OpenResponses ready' : 'Web OpenResponses ready',
          model: defaultModel,
        });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setHealth({
          status: 'offline',
          detail: `${target}/settings unavailable: ${error.message}`,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [draft.localBusUrl, draft.mode, draft.webBusUrl]);

  const updateField = <K extends keyof RuntimeSettings>(key: K, value: RuntimeSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    saveRuntimeSettings(draft);
    setOpen(false);
  };

  const reset = () => {
    setDraft(DEFAULT_RUNTIME_SETTINGS);
    saveRuntimeSettings(DEFAULT_RUNTIME_SETTINGS);
  };

  return (
    <div className="runtime-settings">
      <button
        type="button"
        className="runtime-settings__toggle"
        onClick={() => setOpen((prev) => !prev)}
        title="Runtime settings"
      >
        <Settings2 size={16} /> Runtime
        <span className={`runtime-settings__dot ${health.status}`} />
      </button>

      {open && (
        <div className="runtime-settings__panel">
          <h3>Vega Lab runtime</h3>
          <p>OpenResponses is the contract. Local mode targets the MLX-backed bus.</p>

          <div className={`runtime-settings__health ${health.status}`}>
            <Activity size={14} />
            <div>
              <strong>{health.status === 'live' ? 'OpenResponses live' : health.status === 'checking' ? 'Checking runtime' : 'Runtime offline'}</strong>
              <span>{health.model || health.detail}</span>
            </div>
          </div>

          <label>
            Mode
            <select
              value={draft.mode}
              onChange={(e) => updateField('mode', e.target.value as RuntimeMode)}
            >
              <option value="local">Local (MLX)</option>
              <option value="web">Web API</option>
            </select>
          </label>

          <label>
            Local MLX model
            <input
              value={draft.localModel}
              onChange={(e) => updateField('localModel', e.target.value)}
              placeholder="local-model"
            />
          </label>

          <label>
            Local OpenResponses bus
            <input
              value={draft.localBusUrl}
              onChange={(e) => updateField('localBusUrl', e.target.value)}
              placeholder="/bus"
            />
          </label>

          <label>
            Web model
            <input
              value={draft.webModel}
              onChange={(e) => updateField('webModel', e.target.value)}
              placeholder="gemini-2.5-flash"
            />
          </label>

          <label>
            Web OpenResponses bus
            <input
              value={draft.webBusUrl}
              onChange={(e) => updateField('webBusUrl', e.target.value)}
              placeholder="https://your-web-bus.example.com"
            />
          </label>

          <div className="runtime-settings__actions">
            <button type="button" onClick={save}>Save</button>
            <button type="button" onClick={reset} className="ghost">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}

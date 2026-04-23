import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
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

  useEffect(() => {
    setDraft(loadRuntimeSettings());
  }, []);

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
      </button>

      {open && (
        <div className="runtime-settings__panel">
          <h3>Runtime settings</h3>
          <p>Use local mode for MLX. Switch to web mode for remote/free API tests.</p>

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
            Local model
            <input
              value={draft.localModel}
              onChange={(e) => updateField('localModel', e.target.value)}
              placeholder="local-model"
            />
          </label>

          <label>
            Local bus URL
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
            Web bus URL
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

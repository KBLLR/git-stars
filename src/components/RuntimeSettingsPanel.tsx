import { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  ExternalLink,
  KeyRound,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_RUNTIME_SETTINGS,
  INFERENCE_PROVIDER_PRESETS,
  InferenceProviderPreset,
  RuntimeMode,
  RuntimeSettings,
  getInferenceProviderPreset,
  loadRuntimeSettings,
  saveRuntimeSettings,
} from '../lib/settings';
import { fetchRuntimeHealth } from '../lib/runtime-client';

type RuntimeHealth = {
  status: 'checking' | 'live' | 'offline';
  detail: string;
  model?: string;
};

export function RuntimeSettingsPanel() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RuntimeSettings>(DEFAULT_RUNTIME_SETTINGS);
  const [health, setHealth] = useState<RuntimeHealth>({
    status: 'checking',
    detail: 'Checking OpenResponses gateway',
  });

  const selectedProvider = getInferenceProviderPreset(draft.inferenceProvider);
  const activeRuntimeLabel = draft.mode === 'local' ? 'Local MLX' : 'Inference';

  useEffect(() => {
    setDraft(loadRuntimeSettings());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const target = draft.mode === 'inference' ? draft.inferenceBusUrl : draft.localBusUrl;
    const runtimeLabel = draft.mode === 'local' ? 'Local MLX gateway' : 'Inference gateway';

    setHealth({ status: 'checking', detail: `Checking ${runtimeLabel}` });
    fetchRuntimeHealth(target || DEFAULT_RUNTIME_SETTINGS.localBusUrl)
      .then((summary) => {
        if (cancelled) return;
        setHealth({
          status: summary.status,
          detail: `${runtimeLabel}: ${summary.detail}`,
          model: summary.model,
        });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setHealth({
          status: 'offline',
          detail: `${target || DEFAULT_RUNTIME_SETTINGS.localBusUrl}/health unavailable: ${error.message}`,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [draft.inferenceBusUrl, draft.localBusUrl, draft.mode]);

  const updateField = <K extends keyof RuntimeSettings>(key: K, value: RuntimeSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const applyMode = (mode: RuntimeMode) => {
    updateField('mode', mode);
  };

  const applyProvider = (provider: InferenceProviderPreset) => {
    setDraft((prev) => ({
      ...prev,
      inferenceProvider: provider.id,
      inferenceModel: provider.defaultModel,
      inferenceApiBaseUrl: provider.apiBaseUrl,
      inferenceKeyEnv: provider.keyEnv,
    }));
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
        className={`runtime-settings__toggle ${open ? 'active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        title="Vega Lab settings"
        aria-expanded={open}
      >
        <SlidersHorizontal size={16} />
        <span className="runtime-settings__toggle-label">Settings</span>
        <span className="runtime-settings__toggle-mode">{activeRuntimeLabel}</span>
        <span className={`runtime-settings__dot ${health.status}`} />
      </button>

      {open && (
        <div className="runtime-settings__panel" role="dialog" aria-label="Vega Lab settings">
          <div className="runtime-settings__header">
            <div>
              <h3>Vega Lab Settings</h3>
              <p>OpenResponses is the runtime contract. Local stays MLX-first; inference is for deployed testing.</p>
            </div>
            <div className="runtime-settings__badge">
              <ShieldCheck size={14} />
              No browser keys
            </div>
          </div>

          <div className={`runtime-settings__health ${health.status}`}>
            <Activity size={16} />
            <div>
              <strong>{health.status === 'live' ? 'Runtime online' : health.status === 'checking' ? 'Checking runtime' : 'Runtime offline'}</strong>
              <span>{health.model || health.detail}</span>
            </div>
          </div>

          <div className="runtime-settings__mode-grid" aria-label="Runtime mode">
            <button
              type="button"
              className={`runtime-settings__mode ${draft.mode === 'local' ? 'active' : ''}`}
              onClick={() => applyMode('local')}
            >
              <Cpu size={18} />
              <span>Local MLX</span>
              <small>/bus to 127.0.0.1:8090</small>
            </button>
            <button
              type="button"
              className={`runtime-settings__mode ${draft.mode === 'inference' ? 'active' : ''}`}
              onClick={() => applyMode('inference')}
            >
              <Sparkles size={18} />
              <span>Inference API</span>
              <small>Free-tier provider adapter</small>
            </button>
          </div>

          <section className="runtime-settings__section">
            <div className="runtime-settings__section-title">
              <ServerCog size={15} />
              <span>Local OpenResponses</span>
            </div>
            <label>
              MLX model
              <input
                value={draft.localModel}
                onChange={(event) => updateField('localModel', event.target.value)}
                placeholder={DEFAULT_RUNTIME_SETTINGS.localModel}
              />
            </label>
            <label>
              Local bus URL
              <input
                value={draft.localBusUrl}
                onChange={(event) => updateField('localBusUrl', event.target.value)}
                placeholder="/bus"
              />
            </label>
          </section>

          <section className="runtime-settings__section">
            <div className="runtime-settings__section-title">
              <Sparkles size={15} />
              <span>Inference Provider</span>
            </div>
            <div className="runtime-settings__provider-grid">
              {INFERENCE_PROVIDER_PRESETS.map((provider) => (
                <button
                  type="button"
                  key={provider.id}
                  className={`runtime-settings__provider ${provider.id === draft.inferenceProvider ? 'active' : ''}`}
                  onClick={() => applyProvider(provider)}
                >
                  <span>{provider.label}</span>
                  <small>{provider.defaultModel}</small>
                </button>
              ))}
            </div>

            <div className="runtime-settings__provider-note">
              <span>{selectedProvider.freeTier}</span>
              <a href={selectedProvider.docsUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                Docs <ExternalLink size={12} />
              </a>
            </div>

            <label>
              Inference model
              <input
                value={draft.inferenceModel}
                onChange={(event) => updateField('inferenceModel', event.target.value)}
                placeholder={selectedProvider.defaultModel}
              />
            </label>
            <label>
              OpenResponses gateway URL
              <input
                value={draft.inferenceBusUrl}
                onChange={(event) => updateField('inferenceBusUrl', event.target.value)}
                placeholder="https://your-openresponses-bus.example.com"
              />
            </label>
            <label>
              Provider API base URL
              <input
                value={draft.inferenceApiBaseUrl}
                onChange={(event) => updateField('inferenceApiBaseUrl', event.target.value)}
                placeholder={selectedProvider.apiBaseUrl}
              />
            </label>
            <label>
              Server env key name
              <span className="runtime-settings__input-icon">
                <KeyRound size={14} />
                <input
                  value={draft.inferenceKeyEnv}
                  onChange={(event) => updateField('inferenceKeyEnv', event.target.value)}
                  placeholder={selectedProvider.keyEnv}
                />
              </span>
            </label>
            <p className="runtime-settings__hint">
              Put provider tokens in the Event Bus or deployment environment. Vega Lab stores only routing metadata here.
            </p>
          </section>

          <div className="runtime-settings__actions">
            <button type="button" onClick={reset} className="ghost">Reset</button>
            <button type="button" onClick={save}>Save settings</button>
          </div>
        </div>
      )}
    </div>
  );
}

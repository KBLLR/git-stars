export interface RuntimeHealthSummary {
  status: 'live' | 'offline';
  detail: string;
  model?: string;
}

type ModelDescriptor = string | { id?: string; model?: string; name?: string };

function normalizeModelList(data: unknown): string[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { models?: unknown[] } | null)?.models)
      ? (data as { models: unknown[] }).models
      : Array.isArray((data as { data?: unknown[] } | null)?.data)
        ? (data as { data: unknown[] }).data
        : [];

  return (list as ModelDescriptor[])
    .map((item) => (typeof item === 'string' ? item : item?.id || item?.model || item?.name || null))
    .filter((item): item is string => Boolean(item));
}

async function fetchJson(path: string): Promise<unknown | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return response.json() as Promise<unknown>;
  } catch {
    return null;
  }
}

export async function fetchRuntimeModels(busUrl: string): Promise<string[]> {
  for (const path of [`${busUrl}/v1/models`, `${busUrl}/models?task_kind=llm`]) {
    const data = await fetchJson(path);
    const models = normalizeModelList(data);
    if (models.length > 0) return models;
  }

  return [];
}

export async function fetchRuntimeHealth(busUrl: string): Promise<RuntimeHealthSummary> {
  const health = await fetchJson(`${busUrl}/health`);
  if (health && typeof health === 'object') {
    const payload = health as {
      status?: string;
      service?: string;
      services?: Record<string, { status?: string; current_model?: string }>;
    };
    const llm = payload.services?.['mlx-llm'];
    const model = llm?.current_model;
    const llmStatus = llm?.status ? `; mlx-llm ${llm.status}` : '';
    return {
      status: payload.status === 'healthy' ? 'live' : 'offline',
      detail: `${payload.service || 'MLX OpenResponses gateway'} ${payload.status || 'reachable'}${llmStatus}`,
      model,
    };
  }

  const settings = await fetchJson(`${busUrl}/settings`);
  if (settings && typeof settings === 'object') {
    const defaultModel =
      'models' in settings
      && settings.models
      && typeof settings.models === 'object'
      && 'default_model' in settings.models
      && typeof settings.models.default_model === 'string'
        ? settings.models.default_model
        : undefined;
    return {
      status: 'live',
      detail: 'OpenResponses settings endpoint ready',
      model: defaultModel,
    };
  }

  return {
    status: 'offline',
    detail: `${busUrl}/health and ${busUrl}/settings unavailable`,
  };
}

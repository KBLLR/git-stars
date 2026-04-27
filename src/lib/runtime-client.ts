export interface RuntimeHealthSummary {
  status: 'live' | 'offline';
  detail: string;
  model?: string;
}

export type RuntimeModelSource = 'served' | 'model-zoo-local' | 'model-zoo-candidate';

export type RuntimeModelStatus = 'served' | 'local-loadable' | 'local-incomplete' | 'registry-candidate';

export interface RuntimeModelOption {
  id: string;
  label: string;
  source: RuntimeModelSource;
  status: RuntimeModelStatus;
  served: boolean;
  downloaded: boolean;
  loadable: boolean;
  localPath?: string;
  sourceId?: string;
  sourceUrl?: string;
  capabilities?: string[];
  aliases?: string[];
  evidence?: string[];
}

export interface RuntimeModelCatalog {
  llmModels: string[];
  servedModels: string[];
  options: RuntimeModelOption[];
  totalModels: number;
  hiddenModels: number;
  zooLocalModels: number;
  zooCandidateModels: number;
  incompleteModels: number;
}

type ModelDescriptor = string | {
  id?: string;
  model?: string;
  name?: string;
  owned_by?: string;
  _audio_lane?: string;
  _service?: string;
};

type GatewayModelCatalog = {
  llmModels: string[];
  totalModels: number;
  hiddenModels: number;
};

type ModelZooSnapshot = {
  models?: Array<Partial<RuntimeModelOption> & {
    id?: string;
    runtimeId?: string;
    status?: RuntimeModelStatus;
  }>;
};

function isLlmModel(item: ModelDescriptor): boolean {
  if (typeof item === 'string') return true;
  const id = item.id || item.model || item.name || '';
  if (item._audio_lane || item.owned_by === 'mlx-audio') return false;
  return item._service === 'mlx-llm' || id.startsWith('text/') || (!item._service && Boolean(id));
}

function getModelList(data: unknown): ModelDescriptor[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { models?: unknown[] } | null)?.models)
      ? (data as { models: unknown[] }).models
      : Array.isArray((data as { data?: unknown[] } | null)?.data)
        ? (data as { data: unknown[] }).data
        : [];

  return list as ModelDescriptor[];
}

function normalizeModelList(data: unknown): GatewayModelCatalog {
  const list = getModelList(data);
  const llmModels = list
    .filter(isLlmModel)
    .map((item) => (typeof item === 'string' ? item : item?.id || item?.model || item?.name || null))
    .filter((item): item is string => Boolean(item));

  return {
    llmModels,
    totalModels: list.length,
    hiddenModels: Math.max(0, list.length - llmModels.length),
  };
}

function createEmptyGatewayCatalog(): GatewayModelCatalog {
  return {
    llmModels: [],
    totalModels: 0,
    hiddenModels: 0,
  };
}

function createEmptyRuntimeModelCatalog(): RuntimeModelCatalog {
  return {
    llmModels: [],
    servedModels: [],
    options: [],
    totalModels: 0,
    hiddenModels: 0,
    zooLocalModels: 0,
    zooCandidateModels: 0,
    incompleteModels: 0,
  };
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

function modelMatches(option: RuntimeModelOption, modelId: string): boolean {
  if (option.id === modelId) return true;
  if (option.aliases?.includes(modelId)) return true;
  return option.id.endsWith(`/${modelId}`) || modelId.endsWith(`/${option.id}`);
}

function statusToSource(status?: RuntimeModelStatus): RuntimeModelSource {
  if (status === 'local-loadable' || status === 'local-incomplete') return 'model-zoo-local';
  return 'model-zoo-candidate';
}

function mergeModelOptions(
  servedModels: string[],
  snapshot: ModelZooSnapshot | null,
): RuntimeModelOption[] {
  const options: RuntimeModelOption[] = [];

  for (const servedModel of servedModels) {
    options.push({
      id: servedModel,
      label: servedModel.replace(/^text\//, ''),
      source: 'served',
      status: 'served',
      served: true,
      downloaded: true,
      loadable: true,
      aliases: [servedModel, servedModel.replace(/^text\//, '')],
      evidence: ['Reported by OpenResponses /v1/models'],
    });
  }

  const zooModels = Array.isArray(snapshot?.models) ? snapshot.models : [];
  for (const zooModel of zooModels) {
    const id = zooModel.runtimeId || zooModel.id;
    if (!id) continue;
    const existing = options.find((option) => modelMatches(option, id));
    const aliases = Array.from(new Set([
      ...(existing?.aliases || []),
      ...(zooModel.aliases || []),
      id,
      id.replace(/^text\//, ''),
    ]));
    const status = zooModel.status || (zooModel.loadable ? 'local-loadable' : 'registry-candidate');
    const source = statusToSource(status);

    if (existing) {
      existing.label = zooModel.label || existing.label;
      existing.source = 'served';
      existing.status = 'served';
      existing.downloaded = Boolean(zooModel.downloaded || existing.downloaded);
      existing.loadable = Boolean(zooModel.loadable || existing.loadable);
      existing.localPath = zooModel.localPath || existing.localPath;
      existing.sourceId = zooModel.sourceId || existing.sourceId;
      existing.sourceUrl = zooModel.sourceUrl || existing.sourceUrl;
      existing.capabilities = Array.from(new Set([...(existing.capabilities || []), ...(zooModel.capabilities || [])]));
      existing.aliases = aliases;
      existing.evidence = Array.from(new Set([...(existing.evidence || []), ...(zooModel.evidence || [])]));
      continue;
    }

    options.push({
      id,
      label: zooModel.label || id.replace(/^text\//, ''),
      source,
      status,
      served: false,
      downloaded: Boolean(zooModel.downloaded),
      loadable: Boolean(zooModel.loadable),
      localPath: zooModel.localPath,
      sourceId: zooModel.sourceId,
      sourceUrl: zooModel.sourceUrl,
      capabilities: zooModel.capabilities || [],
      aliases,
      evidence: zooModel.evidence || ['Known by Vega Lab model-zoo snapshot'],
    });
  }

  const rank: Record<RuntimeModelStatus, number> = {
    served: 0,
    'local-loadable': 1,
    'local-incomplete': 2,
    'registry-candidate': 3,
  };

  return options.sort((a, b) => rank[a.status] - rank[b.status] || a.id.localeCompare(b.id));
}

async function fetchModelZooSnapshot(): Promise<ModelZooSnapshot | null> {
  const snapshot = await fetchJson('/model-zoo-text-models.json');
  if (!snapshot || typeof snapshot !== 'object') return null;
  return snapshot as ModelZooSnapshot;
}

export async function fetchRuntimeModels(busUrl: string): Promise<string[]> {
  const catalog = await fetchRuntimeModelCatalog(busUrl);
  return catalog.llmModels;
}

export async function fetchRuntimeModelCatalog(busUrl: string): Promise<RuntimeModelCatalog> {
  let gatewayCatalog = createEmptyGatewayCatalog();

  for (const path of [`${busUrl}/v1/models`, `${busUrl}/models?task_kind=llm`]) {
    const data = await fetchJson(path);
    const catalog = normalizeModelList(data);
    if (catalog.llmModels.length > 0 || catalog.totalModels > 0) {
      gatewayCatalog = catalog;
      break;
    }
  }

  const snapshot = await fetchModelZooSnapshot();
  const options = mergeModelOptions(gatewayCatalog.llmModels, snapshot);
  if (options.length === 0) return createEmptyRuntimeModelCatalog();

  return {
    llmModels: options.map((option) => option.id),
    servedModels: gatewayCatalog.llmModels,
    options,
    totalModels: gatewayCatalog.totalModels,
    hiddenModels: gatewayCatalog.hiddenModels,
    zooLocalModels: options.filter((option) => option.downloaded || option.status === 'local-incomplete').length,
    zooCandidateModels: options.filter((option) => option.source === 'model-zoo-candidate').length,
    incompleteModels: options.filter((option) => option.status === 'local-incomplete').length,
  };
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

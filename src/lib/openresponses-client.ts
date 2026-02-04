export type OpenResponsesEventType =
  | 'response.in_progress'
  | 'response.output_item.added'
  | 'response.output_item.done'
  | 'response.output_text.delta'
  | 'response.function_call_arguments.delta'
  | 'response.completed'
  | 'response.failed'
  | 'error';

export interface OpenResponsesItem {
  type: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  content?: {
    text?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface OpenResponsesEvent {
  type: OpenResponsesEventType;
  response_id?: string;
  item?: OpenResponsesItem;
  item_id?: string;
  call_id?: string;
  delta?: string;
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
  [key: string]: unknown;
}

export interface StreamOptions {
  endpoint: string;
  body: Record<string, unknown>;
  onEvent: (event: OpenResponsesEvent) => void;
  onComplete?: (response_id?: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: OpenResponsesEvent) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const event = JSON.parse(data) as OpenResponsesEvent;
        onEvent(event);
      } catch (error) {
        console.warn('[OpenResponses] Failed to parse event:', data);
      }
    }
  }
}

export function streamOpenResponses(options: StreamOptions): AbortController {
  const { endpoint, body, onEvent, onComplete, onError, signal } = options;
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) controller.abort();
    signal.addEventListener('abort', () => controller.abort());
  }

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      let responseId = '';

      await parseSSEStream(reader, (event) => {
        if (event.response_id) {
          responseId = event.response_id;
        }
        onEvent(event);
        if (event.type === 'response.completed') {
          onComplete?.(responseId);
        }
        if (event.type === 'response.failed' || event.type === 'error') {
          onError?.(new Error(event.error?.message || 'Generation failed'));
        }
      });
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError?.(error);
      }
    });

  return controller;
}

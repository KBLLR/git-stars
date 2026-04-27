export type OpenResponsesEventType =
  | "response.in_progress"
  | "response.output_item.added"
  | "response.output_item.done"
  | "response.output_text.delta"
  | "response.function_call_arguments.delta"
  | "response.completed"
  | "response.failed"
  | "error";

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

function normalizeResponseBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(body.messages) || body.input) return body;

  const messages = body.messages as Array<{ role?: string; content?: string }>;
  const system = messages.find((message) => message.role === "system")?.content;
  const visibleMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role || "user",
      content: (message.content || "").trim(),
    }))
    .filter((message) => {
      if (!message.content) return false;
      return !message.content.startsWith("Vega Lab Orchestrator online.");
    });
  const lastUserIndex = visibleMessages.map((message) => message.role).lastIndexOf("user");
  const lastUser = lastUserIndex >= 0
    ? visibleMessages[lastUserIndex]
    : visibleMessages[visibleMessages.length - 1];
  const recentContext = lastUserIndex > 0
    ? visibleMessages.slice(Math.max(0, lastUserIndex - 6), lastUserIndex)
    : [];
  const input = [
    recentContext.length > 0
      ? `Recent context:\n${recentContext.map((message) => `${message.role}: ${message.content}`).join("\n\n")}`
      : null,
    `Current user request:\n${lastUser?.content || system || ""}`,
  ].filter(Boolean).join("\n\n");

  const rest = { ...body };
  delete rest.messages;
  return {
    ...rest,
    ...(system ? { instructions: system } : {}),
    input: input || system || "",
  };
}

async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: OpenResponsesEvent) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const event = JSON.parse(data) as OpenResponsesEvent;
        onEvent(event);
      } catch {
        console.warn("[OpenResponses] Failed to parse event:", data);
      }
    }
  }
}

export function streamOpenResponses(options: StreamOptions): AbortController {
  const { endpoint, body, onEvent, onComplete, onError, signal } = options;
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) controller.abort();
    signal.addEventListener("abort", () => controller.abort());
  }

  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    },
    body: JSON.stringify(normalizeResponseBody({ ...body, stream: true })),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      let responseId = "";

      await parseSSEStream(reader, (event) => {
        if (event.response_id) {
          responseId = event.response_id;
        }
        onEvent(event);
        if (event.type === "response.completed") {
          onComplete?.(responseId);
        }
        if (event.type === "response.failed" || event.type === "error") {
          onError?.(new Error(event.error?.message || "Generation failed"));
        }
      });
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        onError?.(error);
      }
    });

  return controller;
}

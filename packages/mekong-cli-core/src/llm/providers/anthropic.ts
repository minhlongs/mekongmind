/**
 * Anthropic provider — native Claude Messages API.
 * Uses fetch directly (no SDK dependency for portability).
 */
import type { ChatRequest, ChatResponse, LlmProvider } from '../types.js';

export interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  apiVersion?: string;
  timeoutMs?: number;
}

export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private apiVersion: string;
  private timeoutMs: number;

  constructor(config: AnthropicConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = normalizeAnthropicBaseUrl(config.baseUrl ?? 'https://api.anthropic.com');
    this.defaultModel = config.defaultModel ?? 'claude-sonnet-4-6-20250514';
    this.apiVersion = config.apiVersion ?? '2023-06-01';
    this.timeoutMs = config.timeoutMs ?? readTimeoutMs();
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.defaultModel;
    const startTime = Date.now();
    const shouldStream = request.stream ?? shouldDefaultStream(this.baseUrl);

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 4096,
      messages: this.formatMessages(request),
    };
    if (shouldStream) {
      body.stream = true;
    }

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }
    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }
    if (request.tools?.length) {
      body.tools = request.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const response = await fetch(anthropicMessagesUrl(this.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': shouldStream ? 'text/event-stream' : 'application/json',
        'Connection': 'keep-alive',
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
        ...anthropicCustomHeaders(this.baseUrl),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
      keepalive: true,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = await readAnthropicResponse(response);
    const latencyMs = Date.now() - startTime;

    const textContent = data.content
      ?.filter(b => b.type === 'text')
      .map(b => b.text)
      .join('') ?? '';

    const toolUses = data.content
      ?.filter(b => b.type === 'tool_use')
      .map(b => ({
        id: b.id!,
        name: b.name!,
        arguments: (b.input as Record<string, unknown>) ?? {},
      }));

    return {
      content: textContent,
      toolCalls: toolUses?.length ? toolUses : undefined,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      },
      cost: 0, // calculated by CostTracker
      model: data.model ?? model,
      provider: 'anthropic',
      latencyMs,
      finishReason: mapStopReason(data.stop_reason),
    };
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  private formatMessages(request: ChatRequest): AnthropicMessage[] {
    const messages: AnthropicMessage[] = [];
    for (const msg of request.messages) {
      if (msg.role === 'system') continue; // handled via body.system
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
    return messages;
  }
}

export function anthropicMessagesUrl(baseUrl: string): string {
  const base = normalizeAnthropicBaseUrl(baseUrl);
  if (base.endsWith('/messages')) return base;
  if (base.toLowerCase().includes('zunef.com')) return `${base}/messages`;
  if (base.endsWith('/v1')) return `${base}/messages`;
  return `${base}/v1/messages`;
}

export function normalizeAnthropicBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (
    process.env.ANTHROPIC_ZUNEF_PRESERVE_HOST !== '1'
    && /^https:\/\/claude\.zunef\.com(\/|$)/i.test(trimmed)
  ) {
    return trimmed.replace(/^https:\/\/claude\.zunef\.com/i, 'https://claude-api.zunef.com');
  }
  return trimmed;
}

function anthropicCustomHeaders(baseUrl: string): Record<string, string> {
  const custom = process.env.ANTHROPIC_CUSTOM_HEADERS?.trim();
  if (custom) {
    return Object.fromEntries(
      custom
        .replace(/\n/g, ',')
        .split(',')
        .map(item => item.split(':'))
        .filter(parts => parts.length >= 2)
        .map(([name, ...rest]) => [name.trim(), rest.join(':').trim()])
        .filter(([name, value]) => name && value),
    );
  }
  if (baseUrl.toLowerCase().includes('zunef.com')) {
    return { 'X-ZUNEF-CLIENT': 'claude-code' };
  }
  return {};
}

function shouldDefaultStream(baseUrl: string): boolean {
  const override = process.env.ANTHROPIC_STREAM;
  if (override) return !['0', 'false', 'no', 'off'].includes(override.toLowerCase());
  return baseUrl.toLowerCase().includes('zunef.com');
}

async function readAnthropicResponse(response: Response): Promise<AnthropicResponse> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    return await response.json() as AnthropicResponse;
  }

  const textParts: string[] = [];
  let model: string | undefined;
  let usage: { input_tokens?: number; output_tokens?: number } = {};
  let stopReason: string | undefined;

  const handleLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) return;
    const data = trimmed.slice(6);
    if (data === '[DONE]') return;
    try {
      const event = JSON.parse(data) as {
        type?: string;
        message?: { model?: string; usage?: { input_tokens?: number; output_tokens?: number } };
        usage?: { input_tokens?: number; output_tokens?: number };
        delta?: { text?: string; stop_reason?: string };
      };
      if (event.type === 'message_start') {
        model = event.message?.model ?? model;
        usage = { ...usage, ...(event.message?.usage ?? {}) };
      } else if (event.type === 'message_delta') {
        usage = { ...usage, ...(event.usage ?? {}) };
        stopReason = event.delta?.stop_reason ?? stopReason;
      } else if (event.type === 'content_block_delta' && event.delta?.text) {
        textParts.push(event.delta.text);
      }
    } catch {
      return;
    }
  };

  if (!response.body) {
    for (const line of (await response.text()).split(/\r?\n/)) handleLine(line);
    return {
      content: [{ type: 'text', text: textParts.join('') }],
      model,
      usage,
      stop_reason: stopReason,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let newlineIndex = buffer.search(/\r?\n/);
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(buffer[newlineIndex] === '\r' ? newlineIndex + 2 : newlineIndex + 1);
      handleLine(line);
      newlineIndex = buffer.search(/\r?\n/);
    }
    if (done) break;
  }
  if (buffer) handleLine(buffer);

  return {
    content: [{ type: 'text', text: textParts.join('') }],
    model,
    usage,
    stop_reason: stopReason,
  };
}

function readTimeoutMs(): number {
  const raw = process.env.ANTHROPIC_TIMEOUT_MS ?? process.env.LLM_TIMEOUT_MS;
  if (!raw) return 300_000;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300_000;
}

function mapStopReason(reason?: string): ChatResponse['finishReason'] {
  switch (reason) {
    case 'end_turn': return 'stop';
    case 'tool_use': return 'tool_calls';
    case 'max_tokens': return 'length';
    default: return 'stop';
  }
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  model?: string;
  content?: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: unknown;
  }>;
  stop_reason?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

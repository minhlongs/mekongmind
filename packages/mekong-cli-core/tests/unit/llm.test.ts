import { describe, it, expect, beforeEach } from 'vitest';
import { CostTracker } from '../../src/llm/cost-tracker.js';
import { LlmRouter } from '../../src/llm/router.js';
import { ConfigSchema } from '../../src/types/config.js';
import { MetaRouter } from '../../src/llm/meta-router.js';
import { MultiModelSchema } from '../../src/llm/model-config.js';
import type { ChatRequest, ChatResponse } from '../../src/llm/types.js';
import { AnthropicProvider, anthropicMessagesUrl, normalizeAnthropicBaseUrl } from '../../src/llm/providers/anthropic.js';
import { OpenAICompatProvider } from '../../src/llm/providers/openai-compatible.js';
import { OpenAIProvider } from '../../src/llm/providers/openai.js';
import { LocalProvider } from '../../src/llm/providers/local.js';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  it('records usage', () => {
    const record = tracker.record('openai', 'gpt-4o', 1000, 500, 200);
    expect(record.provider).toBe('openai');
    expect(record.inputTokens).toBe(1000);
    expect(record.cost).toBeGreaterThan(0);
  });

  it('calculates cost correctly for gpt-4o', () => {
    // gpt-4o: $2.5/MTok input, $10/MTok output
    const cost = tracker.calculateCost('gpt-4o', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(12.5, 1);
  });

  it('calculates cost correctly for deepseek-chat', () => {
    // deepseek-chat: $0.14/MTok input, $0.28/MTok output
    const cost = tracker.calculateCost('deepseek-chat', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.42, 2);
  });

  it('tracks summary by model and provider', () => {
    tracker.record('openai', 'gpt-4o', 1000, 500, 100);
    tracker.record('openai', 'gpt-4o', 2000, 1000, 200);
    tracker.record('deepseek', 'deepseek-chat', 5000, 2000, 50);

    const summary = tracker.getSummary();
    expect(summary.totalRequests).toBe(3);
    expect(summary.totalInputTokens).toBe(8000);
    expect(summary.byModel['gpt-4o'].requests).toBe(2);
    expect(summary.byProvider['deepseek'].requests).toBe(1);
  });

  it('resets records', () => {
    tracker.record('openai', 'gpt-4o', 1000, 500, 100);
    tracker.reset();
    expect(tracker.getRecords()).toHaveLength(0);
    expect(tracker.getSummary().totalRequests).toBe(0);
  });

  it('returns empty summary when no records', () => {
    const summary = tracker.getSummary();
    expect(summary.totalRequests).toBe(0);
    expect(summary.avgLatencyMs).toBe(0);
    expect(summary.totalCost).toBe(0);
  });

  it('defaults to Sonnet pricing for unknown model', () => {
    // unknown model falls back to [3, 15] — same as claude-sonnet-4
    const cost = tracker.calculateCost('unknown-model', 1_000_000, 1_000_000);
    const sonnetCost = tracker.calculateCost('claude-sonnet-4', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(sonnetCost, 5);
  });

  it('returns copy of records (immutable)', () => {
    tracker.record('openai', 'gpt-4o', 100, 50, 10);
    const records = tracker.getRecords();
    records.pop();
    expect(tracker.getRecords()).toHaveLength(1);
  });
});

describe('AnthropicProvider', () => {
  it('creates with default config', () => {
    const provider = new AnthropicProvider({ apiKey: 'sk-test' });
    expect(provider.name).toBe('anthropic');
  });

  it('isAvailable returns true when apiKey is set', async () => {
    const provider = new AnthropicProvider({ apiKey: 'sk-test' });
    expect(await provider.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when apiKey is empty', async () => {
    const provider = new AnthropicProvider({ apiKey: '' });
    expect(await provider.isAvailable()).toBe(false);
  });

  it('uses custom baseUrl and model', () => {
    const provider = new AnthropicProvider({
      apiKey: 'sk-test',
      baseUrl: 'https://custom.api.com',
      defaultModel: 'claude-opus-4-20250514',
    });
    expect(provider.name).toBe('anthropic');
  });

  it('builds messages URL without double-appending /v1', () => {
    expect(anthropicMessagesUrl('https://api.anthropic.com')).toBe('https://api.anthropic.com/v1/messages');
    expect(anthropicMessagesUrl('https://api.anthropic.com/v1')).toBe('https://api.anthropic.com/v1/messages');
    expect(anthropicMessagesUrl('https://claude.zunef.com/v1/ai')).toBe('https://claude-api.zunef.com/v1/ai/messages');
    expect(anthropicMessagesUrl('https://claude-api.zunef.com/v1/ai')).toBe('https://claude-api.zunef.com/v1/ai/messages');
    expect(anthropicMessagesUrl('https://claude.zunef.com/v1/ai/messages')).toBe('https://claude-api.zunef.com/v1/ai/messages');
  });

  it('normalizes Zunef frontend host to API host by default', () => {
    expect(normalizeAnthropicBaseUrl('https://claude.zunef.com/v1/ai')).toBe('https://claude-api.zunef.com/v1/ai');
  });

  it('posts to normalized messages URL', async () => {
    const originalFetch = global.fetch;
    const calls: string[] = [];
    const initCalls: RequestInit[] = [];
    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push(String(url));
      initCalls.push(init ?? {});
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 1, output_tokens: 2 },
        stop_reason: 'end_turn',
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    try {
      const provider = new AnthropicProvider({
        apiKey: 'sk-test',
        baseUrl: 'https://api.anthropic.com/v1',
      });
      const response = await provider.chat({
        messages: [{ role: 'user', content: 'hi' }],
      });

      expect(calls[0]).toBe('https://api.anthropic.com/v1/messages');
      expect(initCalls[0].signal).toBeDefined();
      expect(response.content).toBe('ok');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('parses Zunef text/event-stream responses', async () => {
    const originalFetch = global.fetch;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode([
          'event: message_start',
          'data: {"type":"message_start","message":{"model":"claude-sonnet-4-6","usage":{"input_tokens":2,"output_tokens":1}}}',
          '',
          'event: content_block_delta',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"O',
        ].join('\n')));
        controller.enqueue(encoder.encode('K"}}\n\n'));
        controller.close();
      },
    });
    global.fetch = (async () => new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } })) as typeof fetch;

    try {
      const provider = new AnthropicProvider({
        apiKey: 'sk-test',
        baseUrl: 'https://claude.zunef.com/v1/ai',
      });
      const response = await provider.chat({
        messages: [{ role: 'user', content: 'hi' }],
      });

      expect(response.content).toBe('OK');
      expect(response.model).toBe('claude-sonnet-4-6');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('enables low-latency streaming by default for Zunef', async () => {
    const originalFetch = global.fetch;
    let body: Record<string, unknown> | undefined;
    let headers: HeadersInit | undefined;
    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      headers = init?.headers;
      return new Response([
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"ok"}}',
        '',
      ].join('\n'), { status: 200, headers: { 'content-type': 'text/event-stream' } });
    }) as typeof fetch;

    try {
      const provider = new AnthropicProvider({
        apiKey: 'sk-test',
        baseUrl: 'https://claude.zunef.com/v1/ai',
      });
      await provider.chat({
        messages: [{ role: 'user', content: 'hi' }],
      });

      expect(String(headers && (headers as Record<string, string>)['X-ZUNEF-CLIENT'])).toBe('claude-code');
      expect(body?.stream).toBe(true);
      expect(headers).toMatchObject({
        Accept: 'text/event-stream',
        Connection: 'keep-alive',
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('can disable Zunef streaming for compatibility', async () => {
    const originalFetch = global.fetch;
    let body: Record<string, unknown> | undefined;
    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 1, output_tokens: 1 },
        stop_reason: 'end_turn',
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    try {
      const provider = new AnthropicProvider({
        apiKey: 'sk-test',
        baseUrl: 'https://claude.zunef.com/v1/ai',
      });
      await provider.chat({
        messages: [{ role: 'user', content: 'hi' }],
        stream: false,
      });

      expect(body?.stream).toBeUndefined();
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('OpenAIProvider', () => {
  it('creates with default config', () => {
    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    expect(provider.name).toBe('openai');
  });

  it('delegates isAvailable to inner provider', async () => {
    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    // isAvailable tries to fetch /models — will fail in test env
    const available = await provider.isAvailable();
    expect(typeof available).toBe('boolean');
  });
});

describe('LocalProvider', () => {
  it('creates ollama backend with defaults', () => {
    const provider = new LocalProvider({ backend: 'ollama' });
    expect(provider.name).toBe('local-ollama');
  });

  it('creates cloudflare backend with env vars', () => {
    const origAcc = process.env.CF_ACCOUNT_ID;
    const origTok = process.env.CF_API_TOKEN;
    process.env.CF_ACCOUNT_ID = 'test-account';
    process.env.CF_API_TOKEN = 'test-token';

    try {
      const provider = new LocalProvider({ backend: 'cloudflare-workers-ai' });
      expect(provider.name).toBe('local-cloudflare-workers-ai');
    } finally {
      if (origAcc) process.env.CF_ACCOUNT_ID = origAcc;
      else delete process.env.CF_ACCOUNT_ID;
      if (origTok) process.env.CF_API_TOKEN = origTok;
      else delete process.env.CF_API_TOKEN;
    }
  });

  it('throws when CF backend missing credentials', () => {
    const origAcc = process.env.CF_ACCOUNT_ID;
    const origTok = process.env.CF_API_TOKEN;
    delete process.env.CF_ACCOUNT_ID;
    delete process.env.CF_API_TOKEN;

    try {
      expect(() => new LocalProvider({ backend: 'cloudflare-workers-ai' }))
        .toThrow('requires accountId and apiToken');
    } finally {
      if (origAcc) process.env.CF_ACCOUNT_ID = origAcc;
      if (origTok) process.env.CF_API_TOKEN = origTok;
    }
  });

  it('ollama isAvailable returns false when not running', async () => {
    const provider = new LocalProvider({
      backend: 'ollama',
      baseUrl: 'http://localhost:99999',
    });
    const available = await provider.isAvailable();
    expect(available).toBe(false);
  });
});

describe('LlmRouter', () => {
  it('initializes with default config', () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    expect(router.getProviders()).toBeDefined();
    expect(Array.isArray(router.getProviders())).toBe(true);
  });

  it('initializes from LLM_BASE_URL env', () => {
    const originalUrl = process.env.LLM_BASE_URL;
    const originalKey = process.env.LLM_API_KEY;
    process.env.LLM_BASE_URL = 'https://test.example.com/v1';
    process.env.LLM_API_KEY = 'test-key';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      expect(router.getProviders()).toContain('anthropic');
    } finally {
      if (originalUrl) process.env.LLM_BASE_URL = originalUrl;
      else delete process.env.LLM_BASE_URL;
      if (originalKey) process.env.LLM_API_KEY = originalKey;
      else delete process.env.LLM_API_KEY;
    }
  });

  it('routes Claude gateway LLM_BASE_URL through AnthropicProvider', () => {
    const originalUrl = process.env.LLM_BASE_URL;
    const originalKey = process.env.LLM_API_KEY;
    const originalModel = process.env.LLM_MODEL;
    process.env.LLM_BASE_URL = 'https://claude.zunef.com/v1/ai';
    process.env.LLM_API_KEY = 'test-key';
    process.env.LLM_MODEL = 'claude-sonnet-4-6';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      const providers = (router as unknown as { providers: Map<string, unknown> }).providers;
      expect(providers.get('anthropic')).toBeInstanceOf(AnthropicProvider);
      expect(providers.get('anthropic')).not.toBeInstanceOf(OpenAICompatProvider);
    } finally {
      if (originalUrl) process.env.LLM_BASE_URL = originalUrl;
      else delete process.env.LLM_BASE_URL;
      if (originalKey) process.env.LLM_API_KEY = originalKey;
      else delete process.env.LLM_API_KEY;
      if (originalModel) process.env.LLM_MODEL = originalModel;
      else delete process.env.LLM_MODEL;
    }
  });

  it('uses LLM_MODEL for Claude gateway requests without explicit model', async () => {
    const originalUrl = process.env.LLM_BASE_URL;
    const originalKey = process.env.LLM_API_KEY;
    const originalModel = process.env.LLM_MODEL;
    const originalFetch = global.fetch;
    process.env.LLM_BASE_URL = 'https://claude.zunef.com/v1/ai';
    process.env.LLM_API_KEY = 'test-key';
    process.env.LLM_MODEL = 'claude-sonnet-4';
    let body: Record<string, unknown> | undefined;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 1, output_tokens: 1 },
        stop_reason: 'end_turn',
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      const response = await router.chat({
        messages: [{ role: 'user', content: 'ping' }],
      });

      expect(body?.model).toBe('claude-sonnet-4');
      expect(response.model).toBe('claude-sonnet-4');
    } finally {
      global.fetch = originalFetch;
      if (originalUrl) process.env.LLM_BASE_URL = originalUrl;
      else delete process.env.LLM_BASE_URL;
      if (originalKey) process.env.LLM_API_KEY = originalKey;
      else delete process.env.LLM_API_KEY;
      if (originalModel) process.env.LLM_MODEL = originalModel;
      else delete process.env.LLM_MODEL;
    }
  });

  it('uses Zunef-compatible default model when LLM_MODEL is unset', async () => {
    const originalUrl = process.env.LLM_BASE_URL;
    const originalKey = process.env.LLM_API_KEY;
    const originalModel = process.env.LLM_MODEL;
    const originalAnthropicModel = process.env.ANTHROPIC_MODEL;
    const originalFetch = global.fetch;
    process.env.LLM_BASE_URL = 'https://claude.zunef.com/v1/ai';
    process.env.LLM_API_KEY = 'test-key';
    delete process.env.LLM_MODEL;
    delete process.env.ANTHROPIC_MODEL;
    let body: Record<string, unknown> | undefined;
    let headers: HeadersInit | undefined;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      headers = init?.headers;
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 1, output_tokens: 1 },
        stop_reason: 'end_turn',
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      await router.chat({
        messages: [{ role: 'user', content: 'ping' }],
      });

      expect(body?.model).toBe('claude-sonnet-4-6');
      expect(body?.stream).toBe(true);
      expect(headers).toMatchObject({ 'X-ZUNEF-CLIENT': 'claude-code' });
    } finally {
      global.fetch = originalFetch;
      if (originalUrl) process.env.LLM_BASE_URL = originalUrl;
      else delete process.env.LLM_BASE_URL;
      if (originalKey) process.env.LLM_API_KEY = originalKey;
      else delete process.env.LLM_API_KEY;
      if (originalModel) process.env.LLM_MODEL = originalModel;
      else delete process.env.LLM_MODEL;
      if (originalAnthropicModel) process.env.ANTHROPIC_MODEL = originalAnthropicModel;
      else delete process.env.ANTHROPIC_MODEL;
    }
  });

  it('keeps generic LLM_BASE_URL on OpenAI-compatible provider', () => {
    const originalUrl = process.env.LLM_BASE_URL;
    const originalKey = process.env.LLM_API_KEY;
    process.env.LLM_BASE_URL = 'https://api.deepseek.com/v1';
    process.env.LLM_API_KEY = 'test-key';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      const providers = (router as unknown as { providers: Map<string, unknown> }).providers;
      expect(providers.get('anthropic')).toBeInstanceOf(OpenAICompatProvider);
    } finally {
      if (originalUrl) process.env.LLM_BASE_URL = originalUrl;
      else delete process.env.LLM_BASE_URL;
      if (originalKey) process.env.LLM_API_KEY = originalKey;
      else delete process.env.LLM_API_KEY;
    }
  });

  it('throws when all providers fail', async () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    await expect(router.chat({
      messages: [{ role: 'user', content: 'test' }],
      provider: 'nonexistent',
    })).rejects.toThrow();
  });

  it('exposes costTracker', () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    expect(router.costTracker).toBeDefined();
    expect(typeof router.costTracker.getSummary).toBe('function');
  });

  it('getUsageSummary returns empty on init', () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    const summary = router.getUsageSummary();
    expect(summary.totalRequests).toBe(0);
    expect(summary.totalCost).toBe(0);
  });

  it('auto-detects ANTHROPIC_API_KEY from env', () => {
    const original = process.env.ANTHROPIC_API_KEY;
    const originalBase = process.env.ANTHROPIC_BASE_URL;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.ANTHROPIC_BASE_URL = 'https://claude.zunef.com/v1/ai';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      expect(router.getProviders()).toContain('anthropic');
      const providers = (router as unknown as { providers: Map<string, unknown> }).providers;
      expect(providers.get('anthropic')).toBeInstanceOf(AnthropicProvider);
    } finally {
      if (original) process.env.ANTHROPIC_API_KEY = original;
      else delete process.env.ANTHROPIC_API_KEY;
      if (originalBase) process.env.ANTHROPIC_BASE_URL = originalBase;
      else delete process.env.ANTHROPIC_BASE_URL;
    }
  });

  it('auto-detects ANTHROPIC_AUTH_TOKEN from env', () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    const originalToken = process.env.ANTHROPIC_AUTH_TOKEN;
    const originalBase = process.env.ANTHROPIC_BASE_URL;
    delete process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_AUTH_TOKEN = 'zf-test';
    process.env.ANTHROPIC_BASE_URL = 'https://claude.zunef.com/v1/ai';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      expect(router.getProviders()).toContain('anthropic');
      const providers = (router as unknown as { providers: Map<string, unknown> }).providers;
      expect(providers.get('anthropic')).toBeInstanceOf(AnthropicProvider);
    } finally {
      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
      else delete process.env.ANTHROPIC_API_KEY;
      if (originalToken) process.env.ANTHROPIC_AUTH_TOKEN = originalToken;
      else delete process.env.ANTHROPIC_AUTH_TOKEN;
      if (originalBase) process.env.ANTHROPIC_BASE_URL = originalBase;
      else delete process.env.ANTHROPIC_BASE_URL;
    }
  });

  it('keeps direct Anthropic token as fallback beside universal endpoint', () => {
    const originalUrl = process.env.LLM_BASE_URL;
    const originalApiKey = process.env.LLM_API_KEY;
    const originalToken = process.env.ANTHROPIC_AUTH_TOKEN;
    const originalBase = process.env.ANTHROPIC_BASE_URL;
    process.env.LLM_BASE_URL = 'https://claude.zunef.com/v1/ai';
    process.env.LLM_API_KEY = 'primary-key';
    process.env.ANTHROPIC_AUTH_TOKEN = 'backup-key';
    process.env.ANTHROPIC_BASE_URL = 'https://claude-api.zunef.com/v1/ai';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      expect(router.getProviders()).toContain('anthropic');
      expect(router.getProviders()).toContain('anthropic-direct');
    } finally {
      if (originalUrl) process.env.LLM_BASE_URL = originalUrl;
      else delete process.env.LLM_BASE_URL;
      if (originalApiKey) process.env.LLM_API_KEY = originalApiKey;
      else delete process.env.LLM_API_KEY;
      if (originalToken) process.env.ANTHROPIC_AUTH_TOKEN = originalToken;
      else delete process.env.ANTHROPIC_AUTH_TOKEN;
      if (originalBase) process.env.ANTHROPIC_BASE_URL = originalBase;
      else delete process.env.ANTHROPIC_BASE_URL;
    }
  });

  it('auto-detects CF Workers AI from env', () => {
    const origAcc = process.env.CF_ACCOUNT_ID;
    const origTok = process.env.CF_API_TOKEN;
    process.env.CF_ACCOUNT_ID = 'test-acc';
    process.env.CF_API_TOKEN = 'test-tok';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      expect(router.getProviders()).toContain('cloudflare');
    } finally {
      if (origAcc) process.env.CF_ACCOUNT_ID = origAcc;
      else delete process.env.CF_ACCOUNT_ID;
      if (origTok) process.env.CF_API_TOKEN = origTok;
      else delete process.env.CF_API_TOKEN;
    }
  });
});

describe('MetaRouter', () => {
  function createCapturingRouter(calls: ChatRequest[]) {
    return {
      chat: async (request: ChatRequest): Promise<ChatResponse> => {
        calls.push(request);
        return {
          content: 'ok',
          usage: { inputTokens: 1, outputTokens: 1 },
          cost: 0,
          model: request.model ?? 'unknown',
          provider: request.provider ?? 'unknown',
          latencyMs: 1,
          finishReason: 'stop',
        };
      },
    } as unknown as LlmRouter;
  }

  it('routes planning requests to Claude 4.7 thinking defaults', async () => {
    const calls: ChatRequest[] = [];
    const meta = new MetaRouter({
      router: createCapturingRouter(calls),
      config: ConfigSchema.parse({}),
    });

    await meta.route({ messages: [{ role: 'user', content: 'plan the architecture for this adapter' }] });

    expect(calls[0].provider).toBe('anthropic');
    expect(calls[0].model).toBe('claude-opus-4-7');
    expect(calls[0].temperature).toBe(0.1);
    expect(calls[0].maxTokens).toBe(32768);
    expect(calls[0].messages[0].role).toBe('system');
  });

  it('routes coding/default requests to Claude Sonnet coding defaults', async () => {
    const calls: ChatRequest[] = [];
    const meta = new MetaRouter({
      router: createCapturingRouter(calls),
      config: ConfigSchema.parse({}),
    });

    await meta.route({ messages: [{ role: 'user', content: 'implement the provider fix' }] });

    expect(calls[0].provider).toBe('anthropic');
    expect(calls[0].model).toBe('claude-sonnet-4-6');
    expect(calls[0].temperature).toBe(0.3);
    expect(calls[0].maxTokens).toBe(16384);
  });

  it('normalizes explicit local model aliases to the configured local provider', async () => {
    const calls: ChatRequest[] = [];
    const meta = new MetaRouter({
      router: createCapturingRouter(calls),
      config: ConfigSchema.parse({
        models: {
          coding: { provider: 'mlx', model: 'qwen-local', max_tokens: 2048 },
        },
      }),
    });

    await meta.route({ messages: [{ role: 'user', content: 'implement a local-only test' }] });

    expect(calls[0].provider).toBe('local-llm');
    expect(calls[0].model).toBe('qwen-local');
    expect(calls[0].maxTokens).toBe(2048);
  });

  it('parses multi-model defaults without requiring local fallback models', () => {
    const parsed = MultiModelSchema.parse({});
    expect(parsed.models.thinking.provider).toBe('anthropic');
    expect(parsed.models.thinking.model).toBe('claude-opus-4-7');
    expect(parsed.models.coding.model).toBe('claude-sonnet-4-6');
  });
});

/**
 * MLX provider — Apple Silicon (Metal) backend.
 *
 * MLX runs natively on Apple Silicon GPUs via the mlx-lm server.
 * This provider wraps LocalLLMProvider with MLX-appropriate defaults:
 *   - LOCAL_LLM_URL  (default: http://localhost:8001, mlx-lm default)
 *   - LOCAL_LLM_MODEL (default: qwen3.6-35b)
 *   - LLM_API_KEY    (default: 'mlx' — sentinel, not a real key)
 *
 * The MLX server exposes an OpenAI-compatible /v1 endpoint, so the
 * underlying transport is identical to Ollama.  We keep a separate
 * class so callers can opt-in to MLX-specific behaviour (quantisation,
 * context-window negotiation, Metal performance hints) without affecting
 * the generic Ollama path.
 *
 * Router mapping (router.ts):
 *   'mlx' → new MLXProvider(...)
 *   'ollama' → new LocalLLMProvider(...)
 *
 * See docs/harness-engineering.md §Implementation Surface.
 */

import { OpenAICompatProvider } from './openai-compatible.js';
import type { LlmProvider, ChatRequest, ChatResponse } from '../types.js';

const MLX_DEFAULT_BASE_URL = 'http://localhost:8001';
const MLX_DEFAULT_MODEL = 'qwen3.6-35b';

export class MLXProvider implements LlmProvider {
  readonly name = 'mlx';
  private inner: OpenAICompatProvider;
  private baseUrl: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = baseUrl ?? process.env.LOCAL_LLM_URL ?? MLX_DEFAULT_BASE_URL;
    const model = defaultModel ?? process.env.LOCAL_LLM_MODEL ?? MLX_DEFAULT_MODEL;
    this.inner = new OpenAICompatProvider({
      name: 'mlx',
      baseUrl: this.baseUrl.endsWith('/v1') ? this.baseUrl : `${this.baseUrl}/v1`,
      // mlx-lm does not require a real API key; 'mlx' is a sentinel.
      apiKey: process.env.LLM_API_KEY ?? 'mlx',
      defaultModel: model,
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.inner.chat(request);
    // MLX is local inference — zero cloud cost.
    return { ...response, cost: 0, provider: 'mlx' };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const url = this.baseUrl.endsWith('/v1')
        ? `${this.baseUrl}/models`
        : `${this.baseUrl}/v1/models`;
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const url = this.baseUrl.endsWith('/v1')
        ? `${this.baseUrl}/models`
        : `${this.baseUrl}/v1/models`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = (await response.json()) as { data?: Array<{ id: string }> };
      return data.data?.map(m => m.id) ?? [];
    } catch {
      return [];
    }
  }
}

// Backward compat: code that imports OllamaProvider still works.
export { MLXProvider as OllamaProvider };

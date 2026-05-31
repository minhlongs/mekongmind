/**
 * MetaRouter — routes requests to the correct model for the detected intent.
 * Extends existing LlmRouter with intent-based model selection.
 */
import type { ChatRequest, ChatResponse } from './types.js';
import type { MekongConfig } from '../types/config.js';
import type { LlmRouter } from './router.js';
import { classifier, type Intent } from './classifier.js';

const THINKING_SYSTEM_PREFIX = `You are a senior architect and strategist. Think deeply before responding.
Provide structured analysis with clear reasoning chains. Use frameworks when applicable.`;

const CODING_SYSTEM_PREFIX = `You are an expert engineer. Write clean, working code directly.
Follow existing project patterns. No placeholders — complete implementations only.`;

export interface MetaRouterOptions {
    router: LlmRouter;
    config: MekongConfig;
}

type RoutedModelConfig = {
    provider: string;
    model: string;
    temperature?: number;
    max_tokens?: number;
};

const DEFAULT_THINKING_MODEL: RoutedModelConfig = {
    provider: 'anthropic',
    model: 'claude-opus-4-7',
    temperature: 0.1,
    max_tokens: 32768,
};

const DEFAULT_CODING_MODEL: RoutedModelConfig = {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6-20250514',
    temperature: 0.3,
    max_tokens: 16384,
};

function normalizeProvider(provider: string): string {
    if (provider === 'mlx' || provider === 'ollama') return 'local-llm';
    return provider;
}

export class MetaRouter {
    private router: LlmRouter;
    private config: MekongConfig;

    constructor(opts: MetaRouterOptions) {
        this.router = opts.router;
        this.config = opts.config;
    }

    /** Route a request to the appropriate model based on intent */
    async route(request: ChatRequest): Promise<ChatResponse> {
        const intent = classifier.classify(request.messages);
        return this.routeWithIntent(request, intent);
    }

    /** Route with a pre-computed intent (skip re-classification) */
    private async routeWithIntent(
        request: ChatRequest,
        intent: Intent,
    ): Promise<ChatResponse> {
        const isThinking = ['planning', 'reasoning'].includes(intent);

        const modelConfig = isThinking
            ? { ...DEFAULT_THINKING_MODEL, ...this.config.models?.thinking }
            : { ...DEFAULT_CODING_MODEL, ...this.config.models?.coding };
        const provider = normalizeProvider(modelConfig.provider);

        // Build enhanced request with model-specific system prompt
        const enrichedMessages = [...request.messages];

        // Prepend model-specific prefix if no system message exists
        const hasSystem = enrichedMessages.some(m => m.role === 'system');
        if (!hasSystem) {
            const prefix = isThinking ? THINKING_SYSTEM_PREFIX : CODING_SYSTEM_PREFIX;
            enrichedMessages.unshift({ role: 'system', content: prefix });
        }

        try {
            return await this.router.chat({
                ...request,
                messages: enrichedMessages,
                provider,
                model: request.model ?? modelConfig.model,
                temperature: request.temperature ?? modelConfig.temperature,
                maxTokens: request.maxTokens ?? modelConfig.max_tokens,
            });
        } catch (err) {
            // Fallback: retry with fallback model
            const fallbackModel = this.config.models?.fallback ?? 'coding';
            const fallbackConfig = fallbackModel === 'thinking'
                ? { ...DEFAULT_THINKING_MODEL, ...this.config.models?.thinking }
                : { ...DEFAULT_CODING_MODEL, ...this.config.models?.coding };

            if (!fallbackConfig) throw err;

            return await this.router.chat({
                ...request,
                messages: enrichedMessages,
                provider: normalizeProvider(fallbackConfig.provider),
                model: request.model ?? fallbackConfig.model,
                temperature: request.temperature ?? fallbackConfig.temperature,
                maxTokens: request.maxTokens ?? fallbackConfig.max_tokens,
            });
        }
    }

    /** Quick intent check without full LLM call */
    quickIntent(text: string): Intent {
        return classifier.classifyText(text);
    }

    /** Check if a request should use the thinking model */
    needsThinking(text: string): boolean {
        return ['planning', 'reasoning'].includes(this.quickIntent(text));
    }
}

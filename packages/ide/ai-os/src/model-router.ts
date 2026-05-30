import type { ModelRoute } from './types.js';

export type Intent = 'coding' | 'research' | 'planning' | 'debug' | 'writing' | 'general';

export interface RoutedIntent {
  intent: Intent;
  confidence: number;
  route: ModelRoute;
}

export function classifyIntent(input: string): RoutedIntent {
  const lower = input.toLowerCase();
  if (/debug|bug|error|fix|crash|fail|issue/.test(lower)) {
    return {
      intent: 'debug',
      confidence: 0.8,
      route: { provider: 'ollama', model: 'deepseek-r1:32b', tier: 'deep' },
    };
  }
  if (/plan|architect|design|structure|refactor/.test(lower)) {
    return {
      intent: 'planning',
      confidence: 0.7,
      route: { provider: 'ollama', model: 'qwen2.5-coder:32b', tier: 'balanced' },
    };
  }
  if (/research|search|find|learn|explain|what is|how to/.test(lower)) {
    return {
      intent: 'research',
      confidence: 0.75,
      route: { provider: 'ollama', model: 'qwen2.5-coder:32b', tier: 'balanced' },
    };
  }
  if (/write|create|generate|draft|compose/.test(lower)) {
    return {
      intent: 'writing',
      confidence: 0.6,
      route: { provider: 'ollama', model: 'qwen2.5-coder:7b', tier: 'fast' },
    };
  }
  if (/implement|code|feature|function|api|route|component/.test(lower)) {
    return {
      intent: 'coding',
      confidence: 0.65,
      route: { provider: 'ollama', model: 'qwen2.5-coder:32b', tier: 'balanced' },
    };
  }
  return {
    intent: 'general',
    confidence: 0.5,
    route: { provider: 'ollama', model: 'qwen2.5-coder:7b', tier: 'fast' },
  };
}

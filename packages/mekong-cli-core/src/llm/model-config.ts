/**
 * Multi-model config schema extension.
 * Adds thinking/coding model pairs to the existing MekongConfig.
 */
import { z } from 'zod';

const ProviderSchema = z.enum(['anthropic', 'openai', 'deepseek', 'ollama', 'mlx', 'local-llm']);

export const MultiModelSchema = z.object({
  models: z.object({
    thinking: z.object({
      provider: ProviderSchema.default('anthropic'),
      model: z.string().default('claude-opus-4-7'),
      temperature: z.number().min(0).max(1).default(0.1),
      max_tokens: z.number().default(32768),
    }).default({}),
    coding: z.object({
      provider: ProviderSchema.default('anthropic'),
      model: z.string().default('claude-sonnet-4-6-20250514'),
      temperature: z.number().min(0).max(1).default(0.3),
      max_tokens: z.number().default(16384),
    }).default({}),
    fallback: z.enum(['thinking', 'coding']).default('coding'),
  }).default({}),
});

export type MultiModelConfig = z.infer<typeof MultiModelSchema>;
type ModelProvider = z.infer<typeof ProviderSchema>;
type MultiModelOverrides = {
  models?: {
    thinking?: Partial<MultiModelConfig['models']['thinking']>;
    coding?: Partial<MultiModelConfig['models']['coding']>;
  };
};

function parseProvider(value: string | undefined): ModelProvider | undefined {
  const parsed = ProviderSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

// Env var overrides for runtime config injection
export function getEnvOverrides(): MultiModelOverrides {
  const thinkingProvider = parseProvider(process.env.MEKONG_THINKING_PROVIDER);
  const thinkingModel = process.env.MEKONG_THINKING_MODEL;
  const codingProvider = parseProvider(process.env.MEKONG_CODING_PROVIDER);
  const codingModel = process.env.MEKONG_CODING_MODEL;

  const result: MultiModelOverrides = {};

  if (thinkingProvider || thinkingModel) {
    result.models = {
      ...result.models,
      thinking: {
        ...(result.models?.thinking ?? {}),
        ...(thinkingProvider ? { provider: thinkingProvider } : {}),
        ...(thinkingModel ? { model: thinkingModel } : {}),
      },
    };
  }
  if (codingProvider || codingModel) {
    result.models = {
      ...result.models,
      coding: {
        ...(result.models?.coding ?? {}),
        ...(codingProvider ? { provider: codingProvider } : {}),
        ...(codingModel ? { model: codingModel } : {}),
      },
    };
  }

  return result;
}

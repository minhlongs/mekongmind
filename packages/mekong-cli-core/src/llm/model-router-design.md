# Multi-Model Router: Qwen 3.6 (Thinking) ↔ Soren-1-Small (Coding)

## Architecture Overview

Extends the existing `LlmRouter` in `packages/mekong-cli-core/src/llm/router.ts` with a **meta-router** layer that classifies each request as either:
- **Thinking** → Qwen 3.6 (deep reasoning, planning, architecture decisions)
- **Coding/Execution** → Soren-1-Small (2B param, fast code generation, large context window)

## Design Principles

1. **Intent-first routing**: Classify before sending to any model
2. **Zero config required**: Works with existing LlmRouter setup
3. **Fallback safety**: If the primary model fails, retry with the other
4. **System prompt enrichment**: Add model-specific prefixes for better results

## Implementation Status

### ✅ Task #18: Design (COMPLETE)
- Design document created at `model-router-design.md`

### ✅ Task #19: Implement Core (COMPLETE)
| File | Lines | Description |
|------|-------|-------------|
| `classifier.ts` | 73 | Intent classifier using keyword heuristics |
| `meta-router.ts` | 91 | Main routing logic with fallback support |
| `model-config.ts` | 48 | Configuration types and defaults |

### ✅ Task #20: Integrate (COMPLETE)
| File | Lines | Description |
|------|-------|-------------|
| `router.ts` | +30 | Added MODEL_ALIASES map for qwen/soren routing |
| `config.ts` | +6 | Added `models.thinking`, `models.coding`, `models.fallback` config |
| `index.ts` | +2 | Exported `MetaRouter` and `classifier`/`Intent` types |

## Usage Example

```typescript
import { MetaRouter, LlmRouter } from '@mekong/cli-core';

const router = new LlmRouter(config);
const metaRouter = new MetaRouter({ router, config });

// Auto-classify and route
const response = await metaRouter.route(request);

// Or quick-check intent without full routing
const isThinking = metaRouter.needsThinking("Design the auth system");
// → true (planning/reasoning detected)
```

1. **Zero-config defaults**: Uses existing `MEKONG_CONFIG` env vars + new model-specific ones
2. **Classifier-first**: Every user request hits a lightweight keyword+pattern classifier before LLM routing
3. **Fallback chain**: Thinking model fails → fallback to default provider; Coding model busy → fallback to local-llm
4. **Config-driven**: All model mappings live in config, no hardcoding

## Config Schema Extension

Add to `MekongConfig` (in `types/config.ts`):

```typescript
models: z.object({
  thinking: z.object({
    provider: z.enum(['anthropic', 'openai', 'deepseek', 'ollama', 'mlx']).default('mlx'),
    model: z.string().default('qwen-3.6-235b-a22b'),
    temperature: z.number().default(0.1),  // Low for reasoning
    max_tokens: z.number().default(8192),
  }),
  coding: z.object({
    provider: z.enum(['anthropic', 'openai', 'deepseek', 'ollama', 'mlx']).default('mlx'),
    model: z.string().default('soren-1-small-2b'),
    temperature: z.number().default(0.3),  // Slightly higher for creativity
    max_tokens: z.number().default(16384),
  }),
  fallback: z.enum(['thinking', 'coding']).default('coding'),
}).default({}),
```

## Request Classifier

New file: `src/llm/classifier.ts`

Uses regex patterns + keyword matching to classify requests into:
- `planning` — "plan", "design", "architecture", "strategy", "roadmap"
- `reasoning` — "analyze", "compare", "evaluate", "decide", "recommend"
- `coding` — "implement", "write code", "refactor", "fix bug", "add feature"
- `debugging` — "error", "bug", "crash", "throw", "exception"
- `testing` — "test", "verify", "validate", "check"
- `default` — falls back to coding model (faster)

Classifier is deterministic (no LLM call needed), runs in <1ms.

## Meta Router

New file: `src/llm/meta-router.ts`

```typescript
export class MetaRouter {
  private config: MekongConfig;
  private classifier: RequestClassifier;
  
  // Routes to the appropriate model based on classification
  async route(request: ChatRequest): Promise<ChatResponse> {
    const intent = this.classifier.classify(request.messages);
    
    let providerName: string;
    let modelName: string;
    
    switch (intent) {
      case 'planning':
      case 'reasoning':
        providerName = this.config.models.thinking.provider;
        modelName = this.config.models.thinking.model;
        break;
      default:
        providerName = this.config.models.coding.provider;
        modelName = this.config.models.coding.model;
    }
    
    // Inject model-specific system prompt prefix
    const enhancedRequest = this.enrichWithModelPrompt(request, intent);
    
    return this.router.chat({ ...enhancedRequest, provider: providerName, model: modelName });
  }
}
```

## Integration with Existing Orchestrator

Extend `OrchestratorAgent` to support **model-per-pattern**:

| Pattern | Thinking Model (Qwen) | Coding Model (Soren) |
|---------|----------------------|---------------------|
| sequential | ✅ Plan tasks | ✅ Execute each task |
| hierarchical | ✅ Decompose goals | ✅ Implement sub-tasks |
| graph | ✅ Design DAG structure | ✅ Build parallel nodes |

New config option: `agents.model_per_pattern: { plan: 'thinking', execute: 'coding' }`

## File Structure

```
src/llm/
  classifier.ts        ← NEW: intent classification
  meta-router.ts       ← NEW: model selection router
  model-config.ts      ← NEW: config schema extension
  router.ts            ← EXISTING: extends with multi-model support
agents/
  orchestrator.ts      ← MODIFIED: add model-per-pattern routing
  worker.ts            ← MODIFIED: accept model override per task
```

## Workflow Integration (CheetahClaws)

For `/plan` mode + sub-agent workflow:

1. **User request** → MetaRouter classifies as `planning`
2. **Qwen 3.6** generates detailed execution plan
3. **Plan items** → each item classified, routed to Soren-1-Small via WorkerAgent
4. **WorkerAgent** executes with model override from config
5. **Results** → fed back to Qwen for synthesis/verification

## Environment Variables

```bash
# Thinking model (Qwen 3.6)
MEKONG_THINKING_PROVIDER=mlx
MEKONG_THINKING_MODEL=qwen-3.6-235b-a22b
MEKONG_THINKING_URL=http://localhost:8001/v1

# Coding model (Soren-1-Small)  
MEKONG_CODING_PROVIDER=mlx
MEKONG_CODING_MODEL=soren-1-small-2b
MEKONG_CODING_URL=http://localhost:8002/v1

# Classifier override (force all requests to one model)
MEKONG_FORCE_MODEL=coding  # or "thinking"
```

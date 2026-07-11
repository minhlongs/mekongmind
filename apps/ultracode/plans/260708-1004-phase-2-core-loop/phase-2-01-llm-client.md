# Phase 2.1: LLM Client

**Owner:** Backend (forest layer)
**Effort:** 4h
**Blocker:** None

## What to Build

`src/forest/llm/client.ts` — LLM client with streaming, Anthropic primary + OpenRouter fallback.

## File: `src/forest/llm/client.ts`

```typescript
import { getLogger } from "@/lib/logger";

const logger = getLogger("llm-client");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface Finding {
  severity: "critical" | "warning" | "info";
  category: "bug" | "security" | "performance" | "style" | "best-practice";
  title: string;
  description: string;
  file_path: string | null;
  line_start: number | null;
  line_end: number | null;
  suggestion: string | null;
}

export interface StreamReviewOptions {
  code: string;
  language: string;
  model?: string;
  max_tokens?: number;
}

const PRIMARY_MODEL = "claude-sonnet-4-20250514";
const FALLBACK_MODEL = "anthropic/claude-3.5-sonnet";
const DEFAULT_MAX_TOKENS = 4096;

function buildReviewPrompt(code: string, language: string): string {
  return `You are a senior code reviewer. Analyze the following ${language} code and identify issues.

Return findings as a JSON array with objects matching this schema:
\`\`\`json
[
  {
    "severity": "critical|warning|info",
    "category": "bug|security|performance|style|best-practice",
    "title": "short summary (max 60 chars)",
    "description": "detailed explanation",
    "file_path": "inferred path or null",
    "line_start": number or null,
    "line_end": number or null,
    "suggestion": "how to fix or null"
  }
]
\`\`\`

Rules:
- Focus on actionable issues only
- 3-8 findings per review
- Critical: security vulnerabilities, data loss risks
- Warning: bugs, performance issues
- Info: style, best practices
- Return ONLY the JSON array, no markdown fences, no explanation`;
}

function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");
  return key;
}

function getOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    logger.warn("OPENROUTER_API_KEY not set — fallback unavailable");
    return "";
  }
  return key;
}

export async function* streamReview({
  code,
  language,
  max_tokens = DEFAULT_MAX_TOKENS,
}: StreamReviewOptions): AsyncGenerator<string> {
  const prompt = buildReviewPrompt(code, language);
  const messages = [
    { role: "user" as const, content: prompt },
    { role: "user" as const, content: code },
  ];

  // Attempt 1: Anthropic direct
  try {
    yield* streamAnthropic(prompt, code, max_tokens);
    return;
  } catch (err) {
    logger.warn("Anthropic API failed, falling back to OpenRouter", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Attempt 2: OpenRouter fallback
  const orKey = getOpenRouterKey();
  if (!orKey) {
    throw new Error("Both Anthropic and OpenRouter failed. Check API keys.");
  }

  yield* streamOpenRouter(messages, max_tokens);
}

async function* streamAnthropic(
  prompt: string,
  code: string,
  maxTokens: number
): AsyncGenerator<string> {
  const apiKey = getAnthropicKey();

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: PRIMARY_MODEL,
      max_tokens: maxTokens,
      temperature: 0.3,
      system: "You are a senior code reviewer. Analyze code and return findings as a JSON array.",
      messages: [
        { role: "user", content: prompt },
        { role: "user", content: code },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error("Anthropic response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.delta?.text ?? parsed.content?.[0]?.text ?? "";
        if (delta) yield delta;
      } catch {
        // skip unparseable chunks
      }
    }
  }
}

async function* streamOpenRouter(
  messages: { role: "user"; content: string }[],
  maxTokens: number
): AsyncGenerator<string> {
  const apiKey = getOpenRouterKey();

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: FALLBACK_MODEL,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text}`);
  }

  if (!response.body) {
    throw new Error("OpenRouter response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content ?? "";
        if (content) yield content;
      } catch {
        // skip
      }
    }
  }
}
```

**Key implementation notes:**
- `streamAnthropic` and `streamOpenRouter` are private helpers that yield chunks
- Anthropic uses `delta.text` from SSE; OpenRouter uses `choices[0].delta.content`
- Both rely on `response.body.getReader()` — Workers-compatible (no Node streams)
- Logging via `@/lib/logger` — no console.log in production paths
- Temperature 0.3, max_tokens 4096 per acceptance criteria
- Fallback chain: Anthropic → OpenRouter → throw

## Update: `src/db/schema.ts`

Add line to users table:

```sql
github_access_token TEXT
```

Update `CREATE_USERS_TABLE`:

```typescript
export const CREATE_USERS_TABLE = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE NOT NULL,
  login TEXT NOT NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  github_access_token TEXT,
  tier TEXT DEFAULT 'free' NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
)
`;
```

**CRITICAL:** The `github_access_token` column is new. Existing D1 rows will have NULL. That's expected — OAuth flow will populate it on next sign-in.

## Update: `app/auth/callback/route.ts`

Persist the token when creating/updating user:

```typescript
// After fetchGitHubUser(tokenData.access_token), update user INSERT/UPDATE:
await db.prepare(
  "INSERT INTO users (id, github_id, login, name, email, avatar_url, github_access_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
).bind(userId, githubUser.id.toString(), githubUser.login, githubUser.name, githubUser.email, githubUser.avatar_url, tokenData.access_token, now, now).run();

// And UPDATE:
await db.prepare(
  "UPDATE users SET login = ?, name = ?, email = ?, avatar_url = ?, github_access_token = ?, updated_at = datetime('now') WHERE id = ?"
).bind(githubUser.login, githubUser.name, githubUser.email, githubUser.avatar_url, tokenData.access_token, existing.id).run();
```

*Exact file edit:*
- `src/db/schema.ts` — add `github_access_token TEXT` to CREATE_USERS_TABLE (line ~9)
- `app/auth/callback/route.ts` — add `github_access_token` to INSERT and UPDATE statements (lines 35-49 and 26-30)

## Verification

```bash
pnpm exec next build   # must pass, 0 TS errors
pnpm run type-check    # must pass
```

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Anthropic SSE format change | Low | High | Catch parse errors, yield raw text as fallback |
| LLM returns non-JSON | Medium | Medium | Prompt is strict; container code should handle parse failure gracefully |
| Token stored in plaintext D1 | Low | High | Acceptable for MVP (Phase 3 encrypts). Document as known risk. |
| OpenRouter key missing | Medium | High | Graceful error if both providers fail |

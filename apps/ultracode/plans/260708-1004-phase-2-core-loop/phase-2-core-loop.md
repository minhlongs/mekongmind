# Phase 2: Core Loop — Repo Connect + AI Review Engine (Detailed Spec)

Objective: single coherent flow — user connects GitHub repo → clicks "Run Review" → sees streaming AI findings → results stored in D1.

## Key Discovery from Phase 1

`src/lib/auth.ts` exports `signInURL()`, `exchangeCode()`, `fetchGitHubUser()`, `createSession()`, `getSession()`, `signOut()`. The GitHub OAuth `access_token` is NOT stored in session — only JWT with (sub, login, name, avatar_url). To call GitHub APIs we must re-exchange via `exchangeCode()` (needs fresh OAuth code) or store the access token.

Decision: store `github_access_token` in the `users` table. Extend callback flow to persist the token. All GitHub API calls use this stored token directly (no re-OAuth needed).

## Data Flow

```
User → "Connect Repo" button
  → POST /api/repos/register {github_id, owner, repo_name, full_name, default_branch}
    → inserts into D1 repos table linked to user
  → repos page refreshes, shows connected repo card

User → "Run Review" button on repo card
  → POST /api/repos/[owner]/[repo]/review/stream {code?, pr_number?}
    → if pr_number: fetch PR diff from GitHub API (using stored access_token)
    → if code: use provided code directly
    → streamReview(code, language) → AsyncIterable<string>
      → calls Anthropic streaming API (primary) or OpenRouter fallback
      → yields chunks as they arrive
    → pipes chunks to client as SSE (text/event-stream)
    → after stream completes: insert review + findings into D1
  → client renders findings in real-time

User → /dashboard/reviews
  → GET /api/reviews → returns [{id, repo:full_name, status, findings_count, started_at}]
  → list renders with repo JOIN

User → click review → /dashboard/reviews/[id]
  → GET /api/reviews/[id] → returns {review, findings: [{severity, category, title, description, file_path, line_start, line_end, suggestion}]}
  → renders findings with severity badges
```

## LLM Prompt Structure

```typescript
const REVIEW_PROMPT = `You are a senior code reviewer. Analyze the following code and return findings as a JSON array.

Code language: ${language}

For each finding, provide:
- severity: "critical" | "warning" | "info"
- category: "bug" | "security" | "performance" | "style" | "best-practice"
- title: short summary (max 60 chars)
- description: detailed explanation
- file_path: inferred file path or "unknown"
- line_start: estimated line number or null
- line_end: estimated line number or null
- suggestion: how to fix

Return ONLY valid JSON array, no markdown fences, no commentary.`;
```

## API Response Formats

### POST /api/repos/register
```json
{ "id": "uuid", "full_name": "owner/repo", "status": "connected" }
```

### POST /api/repos/[owner]/[repo]/review/stream
SSE events:
```
event: chunk
data: {"text": "Finding 1: ..."}

event: complete
data: {"reviewId": "uuid", "findingsCount": 5}

event: error
data: {"message": "LLM provider unavailable"}
```

### GET /api/reviews
```json
{ "reviews": [{ "id": "uuid", "repo": "owner/repo", "status": "completed", "findingsCount": 3, "startedAt": "2026-07-08T..." }] }
```

### GET /api/reviews/[id]
```json
{
  "review": { "id": "uuid", "repoId": "uuid", "status": "completed", "startedAt": "...", "completedAt": "..." },
  "findings": [
    { "id": "uuid", "severity": "critical", "category": "security", "title": "SQL injection risk", "description": "...", "filePath": "src/db.ts", "lineStart": 42, "lineEnd": 45, "suggestion": "Use parameterized queries" }
  ]
}
```

## Environment Variables

Add to `.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...
```

## D1 Schema Updates

Add `github_access_token TEXT` to users table (nullable — existing users won't have it).

Migration: `ALTER TABLE users ADD COLUMN github_access_token TEXT;`

## Streaming Architecture

```typescript
// In route handler
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of llmClient.streamReview(code, language)) {
      controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`));
    }
    controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify({ reviewId, findingsCount })}\n\n`));
    controller.close();
  },
});
return new Response(stream, {
  headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
});
```

## UI Pages Structure

```
app/(dashboard)/repos/page.tsx        ← REPLACE existing placeholder
app/(dashboard)/reviews/page.tsx      ← NEW
app/(dashboard)/reviews/[id]/page.tsx ← NEW
```

## Parallel Execution Strategy

| Phase | Parallel? | Dependency |
|-------|-----------|------------|
| Phase 1: LLM client | Yes — independent | none |
| Phase 2: Repo APIs | Yes — independent | Phase 1 |
| Phase 3: Review stream | After Phase 1+2 | needs repo APIs |
| Phase 4: Review CRUD | Yes — independent | Phase 1 |
| Phase 5: Repos UI | After Phase 2+3 | needs backend |
| Phase 6: Reviews UI | After Phase 4+5 | needs backend + repos UI |

Phases 1+2+4 can run in parallel (all backend). Phases 5+6 sequential after backend lands.

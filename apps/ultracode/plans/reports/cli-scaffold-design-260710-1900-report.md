# Ultracode CLI — Scaffold Design
**Date:** 2026-07-10
**Status:** Design only — no code changes
**Location:** `apps/ultracode/cli/` (proposed)

---

## 1. CLI Requirements (from brainstorm + workflow reports)

Top-level signal: the dashboard is the only access surface today. Two persona gaps drive CLI demand:

1. **Developer/engineering lead** — wants `npx ultracode review run owner/repo` from terminal (matches `/api/repos/[owner]/[repo]/review/trigger`). Values fast time-to-review over UI polish.
2. **DevOps/CI channel** — wants non-interactive scriptable entry (`ultracode reviews --status pending` or `--json`) so GitHub Actions / cron can gate merges on AI approval.

Shared constraints from existing platform:
- Auth is GitHub OAuth (session cookie in browser; CLI needs the same login state).
- Review execution is async via Inngest; CLI must poll, not block.
- Existing API routes are already the contract (`/api/repos/github`, `/api/repos/register`, `/api/reviews`, `/api/reviews/[id]`, `/api/reviews/[id]/events`).
- Current blockers from `workflow-subagent-260710-1013` are infra-only (missing `INNGEST_EVENT_KEY`, stale D1 `payload` column) — CLI can be built against the existing API surface before those are fixed.

---

## 2. Proposed Command Structure

```
ultracode auth login               # OAuth device-flow login (REPLACES <github_token> argv — safer)
ultracode auth logout              # clear stored session

ultracode repos list               # repos registered to current user
ultracode repos add    <owner/repo> # register a new repo
ultracode repos remove <owner/repo> # unregister

ultracode review run <owner/repo> [--pr <number>] [--label <name>]
ultracode review status <review_id>
ultracode review watch <review_id> # streaming SSE fallback via /events

ultracode reviews                  # recent reviews for the user (default 20)
ultracode reviews --repo <owner/repo>
ultracode reviews --status pending|in_progress|completed|failed
ultracode reviews --json           # machine-readable (CI friendly)
```

Notes:
- `auth login` uses device-code flow (GitHub) so no token is ever typed / stored in plaintext. The brainstorm task description said `auth <github_token>` — that is intentionally upgraded because storing PATs in shell history violates the project’s never-hardcode-keys rule.
- `--json` flag on list commands is the CI/CD entry point (CI can execute ultracode in non-interactive mode without parsing table output).
- `review watch` is optional P2; P1 can skip it since `review status` polls.

---

## 3. Skeleton File Tree

```
apps/ultracode/cli/
  package.json                # commander, chalk, ora, cosign (optional), mekong/ultracode displayName
  tsconfig.json               # strict, ESM, outDir dist/
  src/
    index.ts                  # program init, global --version, --json, --verbose
    commands/
      auth.ts                 # login/logout subcommands
      repos.ts                # list/add/remove
      review.ts               # run/status/watch
      reviews.ts              # listing + filters
    utils/
      api.ts                  # fetch() wrapper with base URL, auth header, retry
      format.ts               # table/JSON rendering (uses cli-table3 or chalk)
      config.ts               # ~/.config/ultracode/config.json loader (stores baseUrl, session)
  tests/
    auth.test.ts
    api.test.ts
```

Size target: ~600–900 LOC total in P1 (minimal sufficient).

---

## 4. API Endpoint Mapping

Each CLI command maps 1:1 to an existing API route (no new server code required once `apps/ultracode/app/api/...` is complete):

| CLI command | HTTP method | Route | Body / Query | Returns |
|---|---|---|---|---|
| `auth login` | POST (device flow) | GitHub OAuth `/login/device/code` + poll `/token` | `client_id` | access_token → stored in `~/.config/ultracode/` |
| `repos list` | GET | `/api/repos` *(current: `/dashboard/repos` page only; P1 might need minimal route)* | session cookie / bearer | repo list |
| `repos list` (fallback) | GET | `/api/repos/github` | — | GitHub-side list |
| `repos add owner/repo` | POST | `/api/repos/register` | `{ full_name, owner, repo }` | created repo |
| `repos remove` | DELETE | *(P1 gap — add `/api/repos/register` DELETE param, or `/api/repos/:id`)* | repo id | 204 |
| `review run owner/repo` | POST | `/api/repos/[owner]/[repo]/review/trigger` | optional `{ pull_number }` | `{ jobId, status }` |
| `review status <id>` | GET | `/api/reviews/[id]` | — | review + findings |
| `review watch <id>` | SSE | `/api/reviews/[id]/events?stream=true` | — | event stream |
| `reviews` | GET | `/api/reviews` | `?repo=<>&status=<>` | review list |
| `reviews --json` | GET | same `/api/reviews` | same | raw JSON |

Derived action from `workflow-subagent-260710-1013` — the platform already exposes `/api/reviews/route.ts` and `/api/reviews/[id]/route.ts`; CLI can consume them immediately. One gap: a `DELETE` endpoint for `repos remove` does not exist yet; either add it in the same phase as the CLI or defer to P2.

---

## 5. Minimal Bootstrap Implementation Order

Priority 1 — skeleton:
1. `package.json` (commander 11.x, chalk 5.x, zod)
2. `tsconfig.json` (strict, ESM)
3. `src/index.ts` — program with version, verbose/--json globals
4. `utils/api.ts` — base URL env (`ULTRACODE_API_URL`), stored bearer, retry
5. `config.ts` — `~/.config/ultracode/config.json` for baseUrl + login state

Priority 2 — auth + repos:
6. `commands/auth.ts`
7. `commands/repos.ts`
8. Verify against live server (needs `INNGEST_EVENT_KEY` set + `payload` column migrated per Sprint 0 unblock)

Priority 3 — review + list:
9. `commands/review.ts` (run + status)
10. `commands/reviews.ts` (list + filters + --json)
11. `format.ts` — table output; `--json` bypasses it

Priority 4 — hardening:
12. Retry with backoff (GitHub rate limits / 429)
13. `ultracode --help` and man-style examples
14. Device-flow UX (`ultracode auth login` prints a code + URL)
15. CI example snippet (GitHub Actions yaml) in `docs/cli-ci.md` (caller can decide scope)

---

## 6. Integration / Security Notes

- `ULTRACODE_API_URL` defaults to the deployed Workers URL; for local dev it should point to `http://localhost:3000` (wrangler dev).
- Session is a JWT (per current `src/lib/auth.ts`). CLI reuses it as a bearer token in `Authorization: Bearer <token>` header — no browser cookies required.
- Never store GitHub PAT in shell history — use device-code flow; if PAT is unavoidable (non-OAuth edge case), persist encrypted via OS keychain (`keytar`), not plain JSON.
- `repos remove` needs a new `DELETE` endpoint before shipping — this is the only CLI feature that touches a not-yet-existing server route.

---

## 7. Open Questions

1. Does the dev team want the CLI shipped in its own npm package (`@ultracode/cli`) or bundled inside `apps/ultracode` as a single-user distribution? Current design assumes `apps/ultracode/cli/` source; publish decision deferred.
2. Auth flow — device-code requires a browser step. Alternative: `ultracode auth login --with-token` (explicit opt-in for CI envs with `ULTRACODE_GITHUB_TOKEN`). Will shape `auth.ts`.
3. The current API has no `DELETE /api/repos/:id`. Should the CLI trigger an unregister call against an existing endpoint whose semantics would have to be added, or do we drop `repos remove` until P2?
4. `repos list` currently requires logging into the dashboard; a public-route `/api/repos` is needed for CLI list to work without browser cookies. Plan assumption: add it alongside auth.

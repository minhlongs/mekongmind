# ULTRACODE — Platform Architecture Brainstorm
**Date:** 2026-07-08
**Status:** AGREED — proceed to planning phase

---

## Problem-First Inversion

### 1. Solution-Jumping Diagnosis
Landing page promises: D1-backed SaaS, Inngest workflows, OpenRouter+Anthropic LLM routing, GitHub OAuth, sprint dashboards, AI shadow review. Current reality: 7-section static export, zero server runtime, one unpersisted API route.

The gap between marketing claims and codebase reality is the core tension. Not "what to build" but "how to honestly build what was promised without burning 6 months on a SaaS no one has beta-tested."

### 2. Underlying Problem
Non-technical CEOs saw a promise ("code review at sprint speed") and want the product. The team has a marketing landing page deployed but no validated product-market fit, no user data, and no proof the AI review engine delivers value. Building full SaaS before validation = building into a void.

### 3. Assumption Challenges
| Assumption | Risk if wrong | Validation test |
|---|---|---|
| CEOs will pay for automated code review | $0 product, hosting wasted | 5–10 beta signups actually use it |
| AI shadow review is good enough without human senior | Unreliable reviews kill trust | Side-by-side AI vs. human review quality |
| CF Workers + D1 + Inngest = stable prod | Cold starts + D1 latency hurt UX | Load test review pipeline at 10 concurrent repos |
| GitHub OAuth is sufficient auth signal | Repo access ≠ team identity | Multi-repo, multi-user org scenarios |

### 4. Problem Statement
Users (engineering leads at SE Asia agencies) struggle to give fast, consistent code feedback across multiple repos and junior devs. Tribal knowledge leaves when seniors leave. Manual review is slow (1–3 days/PR) and inconsistent. **Success = AI review surfaces issues in <5 min with senior-judgment quality, and the team trusts it enough to act on findings.**

### 5. Three Alternative Framings
- **Frame A (Full SaaS build):** Build everything. Pros = clean architecture from day 1. Cons = 3–6 months before first beta sees value.
- **Frame B (MVP validation):** Repo URL input → AI analysis → results page. Proven in 2–4 weeks. Risk = incomplete product may fail to impress beta teams.
- **Frame C (Service-first):** Run manually (Claude Code CLI per repo), productize later. Zero platform risk. Risk = doesn't scale past 5 teams.

### 6. Evidence Status
**Medium.** Beta signup form exists on landing page (has company/role/interest fields). No signup data collected yet. Landing page copy references real event (55K livestream viewers) suggesting genuine audience. No support tickets, no product data.

### 7. Validation Plan
- Week 1–2: Extract landing, scaffold D1 + auth
- Week 3–4: Single-flow MVP (Connect repo → Trigger review → View results)
- Week 5+: Invite 5 beta signups to try it, observe actual usage
- Kill criteria: <3 of 5 beta teams use it >1 time

### 8. Draft Stakeholder Message
"We're building the platform in phases. Phase 1 (this plan) gets the infra + one core flow live so beta teams can connect a repo and get their first AI review within 4 weeks. Phase 2 adds async jobs + LLM routing. Phase 3 adds sprint dashboards + billing. Each phase is independently deliverable and testable."

---

## Evaluated Approaches

### Approach A: Full SaaS from scratch (months)
**Pros:** Clean architecture, complete product
**Cons:** 3–6 months before beta. High risk of building untested features. Large budget burn.

### Approach B: Phased build (RECOMMENDED)
**Pros:** Each phase is independently demoable. Early user feedback shapes later phases. Lowers risk.
**Cons:** Initial release feels thin to users expecting full product.

### Approach C: Service-first, platform later
**Pros:** Zero platform risk. Immediate revenue via consulting.
**Cons:** Doesn't build IP. Can't scale past 10 teams manually.

---

## Final Recommended Architecture

### One repo, two runtimes

```
apps/ultracode/
├── landing/                  # Static export, CF Pages (existing, keep)
│   ├── app/(marketing)/      # 7-section landing page
│   └── landing.config.ts     # output: "export"
├── app/                      # SSR runtime, CF Workers
│   ├── (auth)/               # /auth/github, /auth/callback, /auth/signout
│   ├── (dashboard)/          # /dashboard, /dashboard/repos, /dashboard/reviews
│   ├── (review)/             # /review/[id] — review detail view
│   ├── (pricing)/            # /pricing (Phase 3)
│   ├── api/                  # Serverless API routes
│   │   ├── leads/            # Existing beta signup (keep)
│   │   ├── webhooks/         # Inngest, GitHub webhooks
│   │   │   └── stripe/       # NOWPayments IPN (Phase 3)
│   │   └── review/           # CRUD for reviews (Phase 2)
│   └── globals.css           # Shared design tokens
├── src/
│   ├── lib/
│   │   ├── github.ts         # GitHub API client + webhook verification
│   │   ├── llm-router.ts     # OpenRouter + Anthropic abstraction
│   │   ├── review-engine.ts  # Core AI review orchestration
│   │   └── logger.ts         # CF Workers-compatible logger
│   ├── db/
│   │   ├── schema.ts         # D1 table definitions
│   │   ├── migrations/       # SQL migration files (0001-0050)
│   │   └── client.ts         # createServerClient() wrapper
│   └── types/
│       ├── user.ts
│       ├── repo.ts
│       ├── review.ts
│       └── finding.ts
├── migrations/               # CF D1 migrate CLI output
├── middlewares.ts            # Auth, tier gating
├── package.json
└── wrangler.toml             # CF Pages (landing) + CF Workers (app)

# DROP: landing.config.ts → move to root config
# KEEP: next.config.ts → add SSR mode for app/
```

### Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth | Better Auth (GitHub OAuth) | Cloudflare-native, D1-backed, GitHub = natural for code tool |
| Database | Cloudflare D1 | Already in landing tech stack, zero ops, CF Workers-native |
| LLM routing | OpenRouter primary, Anthropic fallback | OpenRouter free tier for open-source, Anthropic for premium tier |
| Async jobs | Inngest | CF Workers-compatible, retry built-in, step functions |
| Landing | Extract to `landing/`, static export | Keep existing deploy, don't touch working marketing site |
| Hosting | CF Pages (landing) + CF Workers (app) | $0 hosting, single vendor, D1 native |

### D1 schema (5 tables)

```sql
-- users: authenticated GitHub users
CREATE TABLE users (id TEXT PRIMARY KEY, github_id TEXT UNIQUE, email TEXT,
  name TEXT, avatar_url TEXT, tier TEXT DEFAULT 'beta', created_at TEXT);

-- repos: connected GitHub repos per user
CREATE TABLE repos (id TEXT PRIMARY KEY, user_id TEXT, github_repo_id INTEGER,
  full_name TEXT, default_branch TEXT, language TEXT, connected_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id));

-- reviews: review jobs (async)
CREATE TABLE reviews (id TEXT PRIMARY KEY, repo_id TEXT, status TEXT,
  triggered_by TEXT, findings_count INTEGER, created_at TEXT, completed_at TEXT,
  FOREIGN KEY (repo_id) REFERENCES repos(id));

-- findings: individual AI findings within a review
CREATE TABLE findings (id TEXT PRIMARY KEY, review_id TEXT, severity TEXT,
  file_path TEXT, line_start INTEGER, line_end INTEGER, title TEXT,
  description TEXT, suggestion TEXT, confidence REAL,
  FOREIGN KEY (review_id) REFERENCES reviews(id));

-- sprints: sprint tracking (Phase 3)
CREATE TABLE sprints (id TEXT PRIMARY KEY, user_id TEXT, name TEXT,
  start_date TEXT, end_date TEXT, status TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id));
```

---

## Implementation Considerations & Risks

### Near-term (Phase 1)
- Migrating from static export to SSR requires `next.config.ts` change: remove `output: "export"`, keep `trailingSlash`, add Cloudflare adapter via `@cloudflare/nextjs`
- Redploy CF Pages without SSR — use CF Workers for app runtime, CF Pages only for `/` landing
- OR simpler: deploy whole app to CF Workers using `next-on-pages` adapter

### Medium-term (Phase 2)
- GitHub API rate limits: unauthenticated 60/hr, authenticated 5000/hr. Use user's OAuth token.
- AI review latency: OpenRouter + Claude Opus = 10–30s per file. Batch files, use streaming.
- D1 query limits: 1000 reads/sec per database. Use KV cache for hot review results.

### Long-term (Phase 3)
- Inngest on CF Workers requires `inngest` npm package + CF module. Test retry behavior early.
- Multi-tenant isolation: no cross-user repo access. D1 foreign keys enforce this.
- Pricing + NOWPayments: Sophia AI Factory already uses NOWPayments, can reuse integration.

---

## Success Metrics

| Metric | Target | How measured |
|---|---|---|
| Beta signups | 10+ teams | `/api/leads` distinct emails |
| Active repos connected | 8+ | `repos` table count |
| Reviews completed | 50+ | `reviews` table where status='completed' |
| Time-to-first-review | <10 min | User auth → trigger → result |
| Review quality rating | ≥3.5/5 | Post-review feedback form |
| LLM cost/review | <$0.50 | OpenRouter API calls per review job |

---

## Next Steps

1. Write plan.md for Phase 1 (foundation migration)
2. Execute Phase 1: repo restructure + D1 + GitHub OAuth
3. Write plan.md for Phase 2 (core review loop)
4. Execute Phase 2: repo connect → AI review → results
5. Recruit 5 beta teams from existing landing signups
6. Observe usage, iterate before Phase 3 sprint/pricing build

# Mono-Stack Convention

**Status:** ENFORCED for all new projects from Y1 Phase 1
**Override:** Requires Tech Lead + 1 founder approval, documented in `02-decisions.md`

---

## TL;DR

**Default stack:**
- **Frontend marketing/static:** Astro 5 + Tailwind 4 + shadcn/ui
- **Frontend app:** Next.js 15 (App Router) + Tailwind 4 + shadcn/ui
- **Backend:** Cloudflare Workers + Hono
- **Database:** Supabase Postgres + RLS (multi-tenant)
- **Auth:** Supabase Auth (or Better Auth nếu không cần Supabase)
- **Storage:** Cloudflare R2
- **Email:** Resend
- **Payments (Y2+ products):** Polar.sh
- **Analytics:** Cloudflare Web Analytics + PostHog (event tracking)
- **i18n:** next-intl (Next.js) hoặc astro-i18n
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions
- **Deployment:** Cloudflare Pages + Workers (default), Vercel only if explicitly required

**Banned từ Y1:**
- PHP, WordPress (cho dự án mới — chỉ maintain WP cũ kế thừa)
- Vue, Svelte, Solid (consolidation cost > value)
- Django, Rails, Java/Spring, .NET (cho new projects)
- Firebase (avoid lock-in, prefer Supabase)
- Vercel paid plans (cost > Cloudflare equivalent)
- jQuery, Bootstrap (legacy)
- Any tech without 2+ team members familiar

---

## Decision matrix: Astro vs Next.js

| Use case | Choose |
|---|---|
| Marketing site, brochure, landing page, blog SEO-first | **Astro** |
| OCOP traceability landing | **Astro** |
| Customer-facing product catalog (read-heavy) | **Astro** + small client islands |
| Admin dashboard with auth | **Next.js** |
| Vertical SaaS app (HTX, PMS, ERP) | **Next.js** |
| Real-time interactivity (chat, livestream) | **Next.js** + WebSocket |
| Server actions + heavy mutations | **Next.js** |
| Mobile PWA primary | **Next.js** |

**Khi không chắc → chọn Astro nếu lượng JS < 30% page, Next.js nếu > 30%.**

---

## Decision matrix: Database tier per customer

| Customer profile | Choose |
|---|---|
| Web/landing only, không user data | **Cloudflare D1** (SQLite) cho leads/contact form |
| Vertical app < 10 user concurrent | **Supabase Free tier** |
| Vertical app 10–100 user, multi-tenant | **Supabase Pro** ($25/mo, share infrastructure) |
| Enterprise / data sovereignty | **Self-hosted Postgres** + Hetzner/Vultr (premium tier) |

---

## Naming conventions

### Files
- Markdown, configs: kebab-case (`pain-tag-schema.md`)
- React components: PascalCase (`LeadForm.tsx`)
- Utility files: kebab-case (`fetch-lead.ts`)

### Branches
- `main` — production
- `dev` — staging (auto-deploy preview)
- `feat/{ticket-or-slug}` — feature
- `fix/{slug}` — bug fix
- `docs/{slug}` — docs only
- `chore/{slug}` — config, dep updates

### Commits
Conventional Commits enforced via commitlint:
- `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `style:`, `ci:`
- Subject ≤72 char, imperative ("add X" not "added X")
- Body ≤80 char per line
- KHÔNG mention AI/Claude/Cursor trong commit messages

### Repo names
- Core: `mekong-digital` (this repo)
- Customer projects: `customer-{slug}` (private, in same GitHub Org)
- Vertical SaaS Y2+: `app-{vertical}-{name}` (VD: `app-ocop-trace`)

### Package names (shared lib)
- Scope: `@mekong/`
- Examples: `@mekong/ui`, `@mekong/lead-form`, `@mekong/zalo-sdk`

---

## Folder convention (per project)

### Astro project
```
apps/web/
├── src/
│   ├── pages/
│   ├── components/    # Astro components
│   ├── layouts/
│   ├── content/       # Markdown content collections (blog)
│   ├── styles/
│   └── utils/
├── public/
├── astro.config.mjs
├── tailwind.config.ts
└── package.json
```

### Next.js project
```
apps/admin/
├── app/                # App Router
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/         # shared (use @mekong/ui first)
├── lib/
├── hooks/
├── server/             # server actions, db queries
└── ...
```

### Worker project
```
workers/lead-api/
├── src/
│   ├── index.ts
│   └── routes/
├── wrangler.toml
└── package.json
```

---

## Setup checklist for new project

### 0. Pre-setup (5 min)
- [ ] Customer slug agreed
- [ ] SOW signed
- [ ] Notion folder created at `customers/{slug}/`
- [ ] Determine: standalone repo OR sub-folder in core?

### 1. Repo setup (10 min)
- [ ] `gh repo create mekong-digital/customer-{slug} --private`
- [ ] Clone, init pnpm workspace
- [ ] Add `.gitignore`, `LICENSE` (MIT cho core, custom cho customer), `README.md`
- [ ] Setup branch protection on `main` (require PR + 1 approval)
- [ ] Add team access (PM + assigned devs only)

### 2. Workspace structure (5 min)
- [ ] `apps/web/` Astro hoặc `apps/admin/` Next per decision matrix
- [ ] `workers/api/` nếu có backend
- [ ] `packages/` nếu có shared code (NHƯNG prefer push vào core `@mekong/*`)

### 3. Tooling (10 min)
- [ ] Add `pnpm-workspace.yaml`, `tsconfig.base.json`
- [ ] ESLint + Prettier config (sync với core preset `@mekong/eslint-config`)
- [ ] Husky + commitlint
- [ ] Vitest config

### 4. Deploy (15 min)
- [ ] Connect Cloudflare Pages: branch `main` → production, `dev` → preview
- [ ] Custom domain setup (DNS records)
- [ ] Env vars in Cloudflare dashboard
- [ ] Workers deploy via wrangler
- [ ] Setup error tracking (Sentry free tier)

### 5. Customer access (5 min)
- [ ] Add customer to repo (read access)
- [ ] Share Cloudflare dashboard read-only
- [ ] Setup uptime monitoring (Cloudflare healthchecks free)

---

## Stack ratification process

Adding a new technology to the convention:

1. PR to this doc with:
   - **Context:** Why current stack insufficient
   - **Alternatives considered:** ≥2
   - **Trade-offs:** explicit
   - **Migration cost:** if replacing existing
   - **Rollback plan:** how to revert
2. 1-week comment period (other devs)
3. Tech Lead + 1 founder approval
4. Try in 1 project as POC
5. After 2 successful uses → promote to default

Killing a technology:

1. PR to this doc with:
   - **Why:** unused, deprecated, costly
   - **Replacement:** what to use instead
   - **Migration:** if any active project depends
2. Same approval as adding

---

## Q-review action items

Each quarter, audit:
- Which packages in `@mekong/*` had ≥2 uses? Keep. Else: deprecate.
- Which "off-stack" choices were made? Why? Pattern emerging?
- Was the convention enforced? If exceptions made: document.

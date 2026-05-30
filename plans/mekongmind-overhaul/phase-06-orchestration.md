---
title: "Phase 6: Orchestration"
description: "CI/CD fixes, deployment pipeline, monitoring, and release automation"
status: pending
priority: P2
effort: 4-8h
tags: [ci-cd, deployment, monitoring, devops]
---

# Phase 6: Orchestration

## Context

- **16 GitHub Actions workflows** exist — some may reference deleted apps or broken paths
- **`deploy-landing.yml`** — must update to target consolidated `apps/landing/`
- **`deploy-site.yml`**, **`deploy-ide.yml`** — unknown state, need audit
- **No monitoring**: No uptime checks, no Sentry/Datadog, no error tracking configured
- **Release process**: `cli/pyproject.toml` says v6.0.0 but no release workflow exists
- **Platform dir**: `platform/ci-runner/` exists but unclear if active

## Overview

Date: 2026-05-29 | Priority: P2 | Status: Pending | Effort: 4-8h

## Key Insights

- CI/CD is the highest-risk area because breaking changes from Phase 1-2 could break deploy pipelines
- This is deliberately P2 (low priority) — fix CI when it breaks, don't optimize pre-maturely
- The 16 workflows include security-hardening, docsops, factory-validate — some may be aspirational
- No release tagging, no CHANGELOG, no semantic versioning

## Requirements

1. [ ] **Audit all 16 GitHub Actions workflows** for broken paths
2. [ ] **Fix `deploy-landing.yml`** for consolidated landing
3. [ ] **Fix any workflow** referencing deleted dirs from Phase 2
4. [ ] **Set up basic monitoring**: uptime check for landing (e.g., Upptime or checkly)
5. [ ] **Create release workflow**: GitHub Release + changelog generation
6. [ ] **Document deployment**: `docs/operations/deployment.md` with deploy steps per target

## Architecture

```
CI/CD Flow:
  GitHub Push → GitHub Actions
    ├── ci.yml                # lint + test (runs on all PRs)
    ├── deploy-landing.yml    # deploy to CF Pages on main merge
    ├── deploy-ide.yml        # deploy IDE if applicable
    ├── deploy.yml            # general deploy
    ├── gates.yml             # quality gates
    └── security-hardening.yml# security scan

Monitoring:
  Landing → Upptime (GitHub Actions uptime checker, free)
  CLI     → No monitoring yet (future: Sentry for Python)
```

## Related Code Files

- `/Users/macbook/mekongmind/.github/workflows/*.yml` (16 files)
- `/Users/macbook/mekongmind/platform/ci-runner/`
- `/Users/macbook/mekongmind/platform/releases/`
- `/Users/macbook/mekongmind/turbo.json`

## Implementation Steps

1. **Audit workflows**: For each of 16 yml files, verify referenced paths, apps, and scripts exist
2. **Fix broken workflows**:
   - `deploy-landing.yml` — update path from old landing app to `apps/landing/`
   - Remove any references to deleted stub dirs (analytics, tasks, developers)
3. **Review security workflows**: `security-hardening.yml`, `gates.yml` — verify they work, disable if not
4. **Create release workflow**: Tag push → GitHub Release → CHANGELOG from conventional commits
5. **Add Upptime**: Open-source uptime monitor via GitHub Actions (monitors landing URL)
6. **Write deployment docs**: `docs/operations/deployment.md`

## Todo List

- [ ] Audit all 16 workflow files for broken references
- [ ] Fix deploy-landing.yml for consolidated landing
- [ ] Fix any workflow referencing deleted Phase 2 directories
- [ ] Create release workflow (tag → GitHub Release)
- [ ] Set up uptime monitoring for landing
- [ ] Write deployment documentation

## Success Criteria

- All 16 workflows parse without YAML errors
- `deploy-landing.yml` successfully deploys the consolidated landing
- GitHub Release workflow creates releases on tags
- Landing has uptime monitoring with alerts

## Risk Assessment

- **Workflow breakage unknown**: Can't audit without running — some workflows may reference env vars or secrets that don't exist
- **16 workflows is a lot**: Some are likely aspirational/stale — disable, don't fix
- **Security workflows**: `security-hardening.yml` may fail due to scanner setup — disable until ready

## Security Considerations

- Review `security-hardening.yml` for what it scans — don't disable without understanding
- Release workflow should not publish secrets or tokens
- Uptime monitoring doesn't need credentials for a public landing page

## Next Steps

After all phases complete: run through plan.md checklist, verify all success criteria, close the plan.

## Unresolved Questions

- Which GitHub Actions secrets are configured? (`gh secret list` needed)
- Does the team want CD (auto-deploy on merge) or manual releases?
- Is there a Cloudflare account for Pages deployment?

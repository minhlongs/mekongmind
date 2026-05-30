# Mekong CLI — Complete Command Reference
*Total Commands: 400 grouped by layer/prefix.*

## Table of Contents

- [PM Layer (16 commands)](#pm-layer)
- [CTO Layer (15 commands)](#cto-layer)
- [CK Layer (13 commands)](#ck-layer)
- [STUDIO Layer (13 commands)](#studio-layer)
- [DATA Layer (12 commands)](#data-layer)
- [SEC Layer (12 commands)](#sec-layer)
- [WORKER Layer (12 commands)](#worker-layer)
- [ML Layer (11 commands)](#ml-layer)
- [DEV Layer (10 commands)](#dev-layer)
- [AUDIT Layer (7 commands)](#audit-layer)
- [BUSINESS Layer (7 commands)](#business-layer)
- [MARKETING Layer (7 commands)](#marketing-layer)
- [REVOPS Layer (7 commands)](#revops-layer)
- [VENTURE Layer (7 commands)](#venture-layer)
- [FOUNDER Layer (6 commands)](#founder-layer)
- [IAM Layer (6 commands)](#iam-layer)
- [OPS Layer (6 commands)](#ops-layer)
- [QA Layer (6 commands)](#qa-layer)
- [SALES Layer (6 commands)](#sales-layer)
- [DEALFLOW Layer (5 commands)](#dealflow-layer)
- [DEVREL Layer (5 commands)](#devrel-layer)
- [HR Layer (5 commands)](#hr-layer)
- [INCIDENT Layer (5 commands)](#incident-layer)
- [INFRA Layer (5 commands)](#infra-layer)
- [INTL Layer (5 commands)](#intl-layer)
- [MOMENTUM Layer (5 commands)](#momentum-layer)
- [OBS Layer (5 commands)](#obs-layer)
- [PRODUCT Layer (5 commands)](#product-layer)
- [TERRAIN Layer (5 commands)](#terrain-layer)
- [VENDOR Layer (5 commands)](#vendor-layer)
- [AE Layer (4 commands)](#ae-layer)
- [BOARD Layer (4 commands)](#board-layer)
- [CDP Layer (4 commands)](#cdp-layer)
- [COMPLIANCE Layer (4 commands)](#compliance-layer)
- [CORPDEV Layer (4 commands)](#corpdev-layer)
- [DESIGN Layer (4 commands)](#design-layer)
- [ESG Layer (4 commands)](#esg-layer)
- [IR Layer (4 commands)](#ir-layer)
- [RISK Layer (4 commands)](#risk-layer)
- [CONTEXT Layer (3 commands)](#context-layer)
- [ENG Layer (3 commands)](#eng-layer)
- [EXPERT Layer (3 commands)](#expert-layer)
- [FINANCE Layer (3 commands)](#finance-layer)
- [FINOPS Layer (3 commands)](#finops-layer)
- [GATEWAY Layer (3 commands)](#gateway-layer)
- [GOVERNANCE Layer (3 commands)](#governance-layer)
- [GROWTH Layer (3 commands)](#growth-layer)
- [IT Layer (3 commands)](#it-layer)
- [KB Layer (3 commands)](#kb-layer)
- [LEGAL Layer (3 commands)](#legal-layer)
- [PORTFOLIO Layer (3 commands)](#portfolio-layer)
- [SDR Layer (3 commands)](#sdr-layer)
- [TECH Layer (3 commands)](#tech-layer)
- [TREASURY Layer (3 commands)](#treasury-layer)
- [WORKFLOW Layer (3 commands)](#workflow-layer)
- [WRITER Layer (3 commands)](#writer-layer)
- [ACCOUNTING Layer (2 commands)](#accounting-layer)
- [ANALYST Layer (2 commands)](#analyst-layer)
- [BACKEND Layer (2 commands)](#backend-layer)
- [CONTENT Layer (2 commands)](#content-layer)
- [DEVOPS Layer (2 commands)](#devops-layer)
- [ENGINEERING Layer (2 commands)](#engineering-layer)
- [FACTORY Layer (2 commands)](#factory-layer)
- [FRONTEND Layer (2 commands)](#frontend-layer)
- [INTEL Layer (2 commands)](#intel-layer)
- [IPO Layer (2 commands)](#ipo-layer)
- [JUNIOR Layer (2 commands)](#junior-layer)
- [KE Layer (2 commands)](#ke-layer)
- [MATCH Layer (2 commands)](#match-layer)
- [PEOPLE Layer (2 commands)](#people-layer)
- [PLATFORM Layer (2 commands)](#platform-layer)
- [RAAS Layer (2 commands)](#raas-layer)
- [RECRUITER Layer (2 commands)](#recruiter-layer)
- [RELEASE Layer (2 commands)](#release-layer)
- [RELENG Layer (2 commands)](#releng-layer)
- [REVIEW Layer (2 commands)](#review-layer)
- [SRE Layer (2 commands)](#sre-layer)
- [UI Layer (2 commands)](#ui-layer)
- [UX Layer (2 commands)](#ux-layer)
- [4 Layer (1 commands)](#4-layer)
- [ANTIBRIDGE Layer (1 commands)](#antibridge-layer)
- [APPROVE Layer (1 commands)](#approve-layer)
- [BHXH Layer (1 commands)](#bhxh-layer)
- [BRAIN Layer (1 commands)](#brain-layer)
- [BRIDGE Layer (1 commands)](#bridge-layer)
- [CLOUDFLARE Layer (1 commands)](#cloudflare-layer)
- [CODE Layer (1 commands)](#code-layer)
- [COMMANDS Layer (1 commands)](#commands-layer)
- [COOK Layer (1 commands)](#cook-layer)
- [DAILY Layer (1 commands)](#daily-layer)
- [DEPLOY Layer (1 commands)](#deploy-layer)
- [ESCALATION Layer (1 commands)](#escalation-layer)
- [GEMINI Layer (1 commands)](#gemini-layer)
- [IDEA Layer (1 commands)](#idea-layer)
- [KINH Layer (1 commands)](#kinh-layer)
- [MODEL Layer (1 commands)](#model-layer)
- [OPUS Layer (1 commands)](#opus-layer)
- [PHAP Layer (1 commands)](#phap-layer)
- [PLAN Layer (1 commands)](#plan-layer)
- [PRODUCTION Layer (1 commands)](#production-layer)
- [PROJECT Layer (1 commands)](#project-layer)
- [QUICK Layer (1 commands)](#quick-layer)
- [SDLC Layer (1 commands)](#sdlc-layer)
- [SECURITY Layer (1 commands)](#security-layer)
- [SHIP Layer (1 commands)](#ship-layer)
- [TAI Layer (1 commands)](#tai-layer)
- [TEST Layer (1 commands)](#test-layer)
- [THUE Layer (1 commands)](#thue-layer)
- [VAN Layer (1 commands)](#van-layer)
- [VERCEL Layer (1 commands)](#vercel-layer)
- [VIETQR Layer (1 commands)](#vietqr-layer)
- [ZALO Layer (1 commands)](#zalo-layer)

---

## PM Layer
*Total: 16 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong pm-ab-test` | /pm:ab-test — A/B Testing | Experiment design, statistical analysis, auto-rollback |
| `mekong pm-analytics` | /pm:analytics — Product Analytics | Funnel analysis and feature adoption tracking |
| `mekong pm-backlog` | /pm:backlog — Backlog Management | User story management and sprint grooming |
| `mekong pm-competitor` | /pm:competitor — Competitive Intel | Competitive intelligence tracking |
| `mekong pm-delegate` | /pm:delegate — Task Delegation | Break task and delegate to dev level. 3 credits, ~10 min. |
| `mekong pm-feature-flag` | /pm:feature-flag — Feature Flags | Progressive rollout and kill switches |
| `mekong pm-feedback` | /pm:feedback — User Feedback | User feedback collection routed to backlog |
| `mekong pm-milestone` | /pm:milestone — Milestone Tracking | Milestone tracking and status. 2 credits, ~5 min. |
| `mekong pm-okr` | /pm:okr — OKR Review | Set/review OKRs and key results. 3 credits, ~10 min. |
| `mekong pm-plan` | /pm:plan — Implementation Plan | Create implementation plan with phases. 5 credits, ~15 min. |
| `mekong pm-release-note` | /pm:release-note — Release Notes | Changelog generation and stakeholder communication |
| `mekong pm-retro` | /pm:retro — Retrospective | Sprint retrospective. 3 credits, ~10 min. |
| `mekong pm-roadmap` | /pm:roadmap — Roadmap Planning | Roadmap visibility and prioritization with RICE/ICE scoring |
| `mekong pm-scope` | /pm:scope — Scope Definition | Scope definition and boundary setting. 3 credits, ~10 min. |
| `mekong pm-sprint` | /pm:sprint — Sprint Planning | Sprint planning — backlog to sprint tasks. 3 credits, ~15 min. |
| `mekong pm-standup` | /pm:standup — Daily Standup | Daily standup report. 1 credit, ~5 min. |

---

## CTO Layer
*Total: 15 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong cto-architect` | /cto:architect — Architecture Decision | Architecture decision record (ADR). 5 credits, ~15 min. |
| `mekong cto-archive` | /cto:archive — Project Archive | Archive project. 3 credits, ~10 min. |
| `mekong cto-budget` | /cto:budget — Budget Allocation | MCU budget allocation within project. 3 credits, ~10 min. |
| `mekong cto-dashboard` | /cto-dashboard — CTO Brain Health Dashboard | CTO brain health dashboard — ROI scores, active missions, learning state |
| `mekong cto-deploy` | /cto:deploy — Production Deploy | Production deployment decision + execution. 5 credits, ~15 min. |
| `mekong cto-health` | /cto-health — CTO Health Dashboard | Run CTO health check dashboard — all subsystems in one view |
| `mekong cto-incident` | /cto:incident — Incident Response | Incident response orchestration. 8 credits, ~20 min. |
| `mekong cto-observability` | /cto-observability — CTO Observability Dashboard | Full CTO observability dashboard — telemetry, anomalies, dispatch health |
| `mekong cto-onboard` | /cto:onboard — Project Onboarding | Onboard new project to OpenClaw. 8 credits, ~30 min. |
| `mekong cto-review` | /cto:review — Project Health Review | Full project health review. 5 credits, ~20 min. |
| `mekong cto-roadmap` | /cto:roadmap — Technical Roadmap | Technical roadmap generation. 5 credits, ~20 min. |
| `mekong cto-scorecard` | /cto:scorecard — ROI Scorecard | CTO ROI scorecard for single project. 3 credits, ~10 min. |
| `mekong cto-selftest` | /cto-selftest — CTO System Health Check | Run all CTO factory tests — unit + integration + dry-run as health check |
| `mekong cto-team` | /cto:team — Team Planning | Team capacity planning and task routing. 3 credits, ~10 min. |
| `mekong cto-workforce` | /cto-workforce — CTO Workforce Dashboard | Show CTO workforce — registered workers, project states, throughput per pane |

---

## CK Layer
*Total: 13 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ck-binh-phap` | # Actions | ⚔️ Binh Pháp - Strategic execution framework (plan → implement → verify → ship) |
| `mekong ck-claude-mem` | # Claude-Mem Command Handler | Manage claude-mem operations and memory context (requires claude-mem MCP) |
| `mekong ck-marketing-ads` | Marketing Ads - Paid Advertising Bundle | Paid advertising bundle — ad strategy, copy, A/B testing (Ch.2 作戰) |
| `mekong ck-marketing-copy` | Marketing Copy - Copywriting Bundle | Copywriting bundle — page copy, editing, persuasion (Ch.5 勢) |
| `mekong ck-marketing-cro` | Marketing CRO - Conversion Rate Optimization Bundle | CRO bundle — landing page, form, checkout optimization (Ch.4 形勢) |
| `mekong ck-marketing-growth` | Marketing Growth - Growth Engineering Bundle | Growth engineering bundle — referrals, viral loops, free tools (Ch.12 火攻) |
| `mekong ck-marketing-local` | Marketing Local - Local Business Bundle | Local business marketing bundle — schema markup, local SEO (Ch.10 地形) |
| `mekong ck-marketing-seo` | Marketing SEO - Search Engine Optimization Bundle | SEO bundle — audit, programmatic SEO, technical SEO (Ch.3 謀攻) |
| `mekong ck-marketing` | Marketing Constitution - Universal Marketing Command | Marketing Constitution — universal marketing command for all projects |
| `mekong ck-raas-flow` | /ck-raas-flow — RAAS Pipeline Status Dashboard | RAAS Pipeline Status Dashboard — view progress across all projects in plans/ |
| `mekong ck-remember` | ck-remember | Search claude-mem for context about current work |
| `mekong ck-save` | ck-save | Write an overview and save with claude-mem |
| `mekong ck-techdebt` | /techdebt - Technical Debt Scanner | Scan and clean duplicated or messy code — technical debt scanner |

---

## STUDIO Layer
*Total: 13 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong studio-allocate` | /studio:allocate — Budget Allocation | Reallocate MCU budget across projects. 3 credits, ~10 min. |
| `mekong studio-audit` | /studio:audit — Portfolio Audit | Full portfolio ROI audit across all projects. Delegates cto:review per project. 10 credits, ~60 min. |
| `mekong studio-bootstrap` | /studio:bootstrap — Bootstrap Venture Studio | Bootstrap venture studio — call mekong CLI engine. 1 command, ~15 min. |
| `mekong studio-diligence-deep` | /studio:diligence:deep — Deep Due Diligence Pipeline | Deep due diligence — market + team + tech + financial + legal analysis. 5 parallel agents, ~25 min. |
| `mekong studio-divest` | /studio:divest — Project Divestment | Archive/sunset a portfolio project. 5 credits, ~15 min. |
| `mekong studio-invest` | /studio:invest — New Investment | Add new project to portfolio. 8 credits, ~30 min. |
| `mekong studio-launch-full` | /studio:launch:full — Full Venture Launch Pipeline | Full venture launch — thesis → source deals → screen → create company. 6 commands, ~30 min. |
| `mekong studio-operate-daily` | /studio:operate:daily — Daily Studio Operations | Daily studio ops — standup, tickets, invoices, metrics across all portfolio companies. 4 commands, ~10 min. |
| `mekong studio-portfolio` | /studio:portfolio — Portfolio Dashboard | Portfolio dashboard — P&L, MRR, runway. 5 credits, ~15 min. |
| `mekong studio-report` | /studio:report — Investor Report | Generate investor report (weekly/monthly). 5 credits, ~20 min. |
| `mekong studio-roi` | /studio:roi — ROI Scorecard | ROI scorecard across all projects. 3 credits, ~10 min. |
| `mekong studio-sprint-weekly` | /studio:sprint:weekly — Weekly Studio Sprint | Weekly studio sprint — portfolio status, follow-ups, cross-portfolio insights, report. 5 commands, ~20 min. |
| `mekong studio-strategy` | /studio:strategy — Strategic Planning | Strategic planning session. 8 credits, ~30 min. |

---

## DATA Layer
*Total: 12 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong data-access` | /data:access — Data Access Control | Row-level security and audit logging |
| `mekong data-catalog` | /data:catalog — Data Catalog | Data discovery and lineage tracking |
| `mekong data-daily-pipeline` | /data:daily-pipeline — Daily Data Pipeline | Daily pipeline — ingest, transform, quality check |
| `mekong data-full-refresh` | /data:full-refresh — Full Data Refresh | Full refresh — ingest, transform, quality, catalog in parallel, then metrics |
| `mekong data-ingest` | /data:ingest — Data Ingestion | Pipeline orchestration with Fivetran/Airbyte connectors |
| `mekong data-metric` | /data:metric — Semantic Layer | Semantic layer for consistent KPI definitions |
| `mekong data-pipeline` | /data:data-pipeline — Data Pipeline | Data pipeline setup — source config, transform logic, destination mapping, validation. 4 steps, ~20 min. |
| `mekong data-quality` | /data:quality — Data Quality | Freshness, volume, and schema monitoring |
| `mekong data-query` | /data:data-query — Data Query Analyst | Data analysis query — SQL/query generation, execution plan, result interpretation. 2 steps, ~10 min. |
| `mekong data-reverse-etl` | /data:reverse-etl — Reverse ETL | Push warehouse data to CRM and tools |
| `mekong data-transform` | /data:transform — Data Transform | dbt run/test with lineage tracking |
| `mekong data-warehouse` | /data:warehouse — Warehouse Admin | Warehouse administration and cost monitoring |

---

## SEC Layer
*Total: 12 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong sec-access-review` | /sec:access-review — Access Review | SOX quarterly access recertification |
| `mekong sec-audit` | /sec:audit — Compliance Audit | Continuous compliance monitoring (SOC2/ISO27001) |
| `mekong sec-compliance-report` | /sec:compliance-report — Compliance Report | Generate compliance evidence packages |
| `mekong sec-full-audit` | /sec:full-audit — Full Security Audit | Complete security audit — scan, vuln, access review, compliance report |
| `mekong sec-incident-response` | /sec:incident-response — Incident Response | Full incident response — SOC triage, incident workflow, postmortem |
| `mekong sec-incident` | /sec:incident — Incident Response | Security incident response workflow |
| `mekong sec-pentest` | /sec:pentest — Penetration Test | Penetration testing management |
| `mekong sec-policy` | /sec:policy — Policy Enforcement | Policy-as-code enforcement |
| `mekong sec-scan` | /sec:scan — Security Scan | SAST/DAST/SCA scanning pipeline |
| `mekong sec-secrets` | /sec:secrets — Secrets Management | Secrets management and rotation |
| `mekong sec-soc` | /sec:soc — SOC Dashboard | Security operations center dashboard |
| `mekong sec-vuln` | /sec:vuln — Vulnerability Management | Vulnerability management lifecycle |

---

## WORKER Layer
*Total: 12 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong worker-backup` | /worker-backup — Worker Operation | Backup project state: git stash, export configs, snapshot data |
| `mekong worker-build` | /worker:build — Atomic Compile & Bundle | Worker compile atomic command. 1 credit. |
| `mekong worker-code` | /worker-code — Worker Operation | Write code for a specific task — focused single-file implementation |
| `mekong worker-commit` | /worker-commit — Worker Operation | Stage, validate, and commit changes with conventional message |
| `mekong worker-exec` | /worker-exec — Worker Operation | Execute a shell command safely with timeout and error handling |
| `mekong worker-health` | /worker-health — Worker Operation | Health check: build status, test results, dependency audit |
| `mekong worker-log` | /worker-log — Worker Operation | View and analyze recent logs for debugging |
| `mekong worker-push` | /worker-push — Worker Operation | Push commits to remote with CI/CD verification |
| `mekong worker-rollback` | /worker-rollback — Worker Operation | Rollback to previous known-good state |
| `mekong worker-scan` | /worker-scan — Worker Operation | Scan codebase for issues: tech debt, security, code quality |
| `mekong worker-test` | /worker-test — Worker Operation | Run tests with coverage reporting and failure analysis |
| `mekong worker-trace` | /worker-trace — Worker Operation | Trace execution flow for debugging complex issues |

---

## ML Layer
*Total: 11 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ml-cost` | /ml:cost — Inference Cost | Per-request cost tracking and budget alerting |
| `mekong ml-deploy` | /ml:deploy — Model Deploy | Model deployment with A/B serving and canary rollouts |
| `mekong ml-eval` | /ml:eval — Prompt Evaluation | Prompt regression testing and semantic evaluation |
| `mekong ml-experiment` | /ml:experiment — ML Experiment | Experiment tracking and model versioning |
| `mekong ml-feature-backfill` | /ml:feature-backfill — Feature Backfill | Backfill historical features for training |
| `mekong ml-feature-register` | /ml:feature-register — Feature Register | Register ML features with metadata and lineage |
| `mekong ml-feature-serve` | /ml:feature-serve — Feature Serve | Serve features for real-time inference |
| `mekong ml-governance` | /ml:governance — AI Governance | Audit trail, EU AI Act compliance, model cards |
| `mekong ml-guardrail` | /ml:guardrail — AI Guardrails | Content safety, output validation, fallback mechanisms |
| `mekong ml-monitor` | /ml:monitor — Model Monitor | Drift detection, latency, hallucination rates, cost per inference |
| `mekong ml-retrain` | /ml:retrain — Auto Retrain | Automated retraining triggers |

---

## DEV Layer
*Total: 10 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong dev-audit` | /dev:audit — Developer Level | Dev audit command. Delegates to worker level. |
| `mekong dev-bug-sprint` | /dev:bug-sprint — Bug Sprint | Bug sprint — debug, fix, test. Batch bug fixes in 15 min |
| `mekong dev-debug` | /dev:debug — Developer Level | Dev debug command. Delegates to worker level. |
| `mekong dev-deploy` | /dev:deploy — Developer Level | Dev deploy command. Delegates to worker level. |
| `mekong dev-design` | /dev:design — Developer Level | Dev design command. Delegates to worker level. |
| `mekong dev-feature` | /dev:feature — Feature Build | Feature build — plan, code, test, PR. Full feature cycle in 15 min |
| `mekong dev-pr-review` | /dev:pr-review — PR Review | PR review — code review and security check in parallel, 10 min |
| `mekong dev-refactor` | /dev:refactor — Developer Level | Dev refactor command. Delegates to worker level. |
| `mekong dev-review` | /dev:review — Developer Level | Dev review command. Delegates to worker level. |
| `mekong dev-scaffold` | /dev:scaffold — Developer Level | Dev scaffold command. Delegates to worker level. |

---

## AUDIT Layer
*Total: 7 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong audit-compliance` | /compliance:audit-compliance — Compliance Audit | Full compliance audit — policy review, gap analysis, remediation plan. 3 steps, ~25 min. |
| `mekong audit-execute` | /audit:execute — Audit Execution | Fieldwork tracking and evidence collection |
| `mekong audit-itgc` | /audit:itgc — ITGC Testing | IT General Controls testing |
| `mekong audit-plan` | /audit:plan — Audit Planning | Risk-based audit planning |
| `mekong audit-report` | /compliance:audit-report — Audit Report Generator | Generate audit report from findings — executive summary, detailed findings, risk ratings. 2 steps, ~12 min. |
| `mekong audit-sox` | /audit:sox — SOX Testing | SOX ICFR testing — walkthroughs, control design, OE |
| `mekong audit-trail` | /compliance:audit-trail — Audit Trail | Audit trail extraction — event log, access history, change tracking. 2 steps, ~10 min. |

---

## BUSINESS Layer
*Total: 7 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong business-campaign-launch` | Campaign Launch | Multi-channel marketing campaign — content, ads, email, social, SEO. 6 commands, ~35 min. |
| `mekong business-client-onboard` | Client Onboarding | New client setup — contract, project setup, kickoff deck, schedule. 4 commands, ~15 min. |
| `mekong business-financial-close` | Financial Close | Monthly/quarterly close — reconcile, report, forecast, tax prep. 5 commands, ~25 min. |
| `mekong business-hiring-sprint` | Hiring Sprint | End-to-end recruiting — JD, sourcing, interview kit, comp benchmarking. 4 commands, ~20 min. |
| `mekong business-quarterly-review` | Quarterly Business Review | QBR across all departments — revenue, expenses, KPIs, team, forecast. 6 commands, ~30 min. |
| `mekong business-report` | /analytics:business-report — Business Performance Report | Business performance report — revenue, growth, operational metrics, recommendations. 3 steps, ~20 min. |
| `mekong business-revenue-engine` | Revenue Engine Setup | Build complete revenue pipeline — leads, CRM, sales, invoicing, analytics. 7 commands, ~40 min. |

---

## MARKETING Layer
*Total: 7 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong marketing-brand` | /marketing:marketing-brand — Brand Strategy | Brand strategy — positioning, voice, visual identity guidelines, messaging framework. 4 steps, ~30 min. |
| `mekong marketing-campaign-run` | /marketing:campaign-run — Campaign Execution | Audience targeting, ad creatives, channel strategy, campaign launch checklist. 4 commands, ~25 min. |
| `mekong marketing-campaign` | /marketing:marketing-campaign — Marketing Campaign | Campaign planning — audience, channels, content, budget, timeline, KPIs. 4 steps, ~25 min. |
| `mekong marketing-content-engine` | /marketing:content-engine — Content Engine | SEO research, content calendar, blog drafts, social posts, email sequences. 5 commands, ~35 min. |
| `mekong marketing-performance-report` | /marketing:performance-report — Marketing Performance | Channel metrics, SEO health audit, ROI analysis, optimization recommendations. 3 commands, ~15 min. |
| `mekong marketing-seo` | /marketing:marketing-seo — SEO Analysis | SEO analysis — keyword research, competitor analysis, on-page audit, content gaps. 3 steps, ~20 min. |
| `mekong marketing-vn` | /marketing-vn — Marketing & Content VN | Marketing VN: Zalo content, Facebook ads, TikTok script, SEO tiếng Việt. |

---

## REVOPS Layer
*Total: 7 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong revops-attribution` | /revops:attribution — Attribution Analysis | Multi-touch attribution and channel ROI |
| `mekong revops-comp` | /revops:comp — Commission Calc | Commission calculation and SPIFs |
| `mekong revops-forecast` | /revops:forecast — Revenue Forecast | Pipeline-weighted forecast and scenario modeling |
| `mekong revops-handoff` | /revops:handoff — Lead Handoff | SLA-governed lead and opportunity handoff |
| `mekong revops-health` | /revops:health — Customer Health | Unified customer health score — CS + sales + usage |
| `mekong revops-pipeline` | /revops:pipeline — Pipeline Visibility | Unified pipeline visibility across sales stages |
| `mekong revops-territory` | /revops:territory — Territory Planning | Territory planning and quota allocation |

---

## VENTURE Layer
*Total: 7 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong venture-due-diligence` | /venture:venture-due-diligence — Venture Due Diligence | Due diligence report — market analysis, team assessment, financial review, risk factors. 4 steps, ~30 min. |
| `mekong venture-five-factors` | /venture:five-factors — Five-Factor Evaluation (道天地將法) | Run 道天地將法 five-factor evaluation for deal or company. 1 command, ~10 min. |
| `mekong venture-momentum` | /venture:momentum — Momentum Score (勢) | Calculate momentum score (勢) for company or market. 1 command, ~5 min. |
| `mekong venture-portfolio` | /venture:venture-portfolio — Venture Portfolio Review | Portfolio review — company updates, performance tracking, follow-on decisions. 3 steps, ~20 min. |
| `mekong venture-terrain` | /venture:terrain — Sun Tzu Terrain Analysis | Sun Tzu terrain analysis (地形篇) for market/sector. 1 command, ~8 min. |
| `mekong venture-thesis` | /venture:thesis — Investment Thesis Management | Define, update, or evaluate investment thesis. 1 command, ~5 min. |
| `mekong venture-void-substance` | /venture:void-substance — Void-Substance Market Map (虚実) | Void-substance analysis (虚実) — find where competitors are hollow. 1 command, ~8 min. |

---

## FOUNDER Layer
*Total: 6 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong founder-ipo` | IPO Preparation Pipeline | 18-month IPO readiness — audit, S-1, roadshow, day-of execution. 7 commands, ~60 min. |
| `mekong founder-negotiate` | Deal Negotiation Kit | Analyze term sheet + model dilution + plan negotiation strategy. 4 commands, ~20 min. |
| `mekong founder-okr` | /venture:founder-okr — Founder OKRs | Founder OKR setting — vision alignment, quarterly objectives, key results, scoring. 3 steps, ~15 min. |
| `mekong founder-pitch` | /venture:founder-pitch — Founder Pitch Deck | Pitch deck creation — problem, solution, market, traction, financials, ask. 6 steps, ~35 min. |
| `mekong founder-raise` | Fundraise Pipeline | Complete fundraise preparation — from unit economics to investor targeting. 8 commands, ~45 min. |
| `mekong founder-validate` | Business Validation Sprint | Validate business model before spending money — PMF, economics, market, moat. 5 commands, ~25 min. |

---

## IAM Layer
*Total: 6 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong iam-deprovision` | /iam:deprovision — Access Revocation | Immediate access revocation on termination |
| `mekong iam-pam` | /iam:pam — Privileged Access | Privileged access management with JIT elevation |
| `mekong iam-provision` | /iam:provision — User Provisioning | Automated user provisioning via SCIM/SSO |
| `mekong iam-rbac` | /iam:rbac — RBAC Management | Role-based access control matrix management |
| `mekong iam-review` | /iam:review — Access Recertification | Quarterly access recertification with evidence |
| `mekong iam-sod` | /iam:sod — SoD Detection | Segregation of duties violation detection |

---

## OPS Layer
*Total: 6 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ops-disaster-recovery` | Disaster Recovery Test | Backup → test restore → verify integrity → document. 3 commands, ~15 min. |
| `mekong ops-health-sweep` | Full Health Sweep | System-wide health audit — services, security, performance, sync status. 5 commands, ~15 min. |
| `mekong ops-health` | /ops:ops-health — Operations Health Check | Operations health check — system status, capacity planning, bottleneck analysis. 3 steps, ~15 min. |
| `mekong ops-security-audit` | Security Audit | Dependency scan → code audit → config review → remediation plan. 3 commands, ~20 min. |
| `mekong ops-status` | /ops:ops-status — Operations Status | Operations status report — uptime, incidents, SLA compliance, team velocity. 2 steps, ~10 min. |
| `mekong ops-sync-all` | Full System Sync | Sync everything in parallel — agents, skills, MCP, artifacts, rules. 6 commands, ~10 min. |

---

## QA Layer
*Total: 6 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong qa-accessibility` | /qa:accessibility — Accessibility Audit | WCAG AA accessibility audit |
| `mekong qa-chaos` | /qa:chaos — Chaos Engineering | Chaos engineering — fault injection and resilience testing |
| `mekong qa-e2e` | /qa:e2e — E2E Tests | End-to-end test execution with Playwright |
| `mekong qa-perf` | /qa:perf — Performance Testing | Performance and load testing with k6 |
| `mekong qa-plan` | /qa:plan — Test Plan | Test plan generation from requirements |
| `mekong qa-regression` | /qa:regression — Regression Tests | Regression test suite management |

---

## SALES Layer
*Total: 6 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong sales-deal-close` | /sales:deal-close — Deal Closer | Research buyer, build proposal, pricing strategy, closing playbook. 4 commands, ~20 min. |
| `mekong sales-forecast` | /sales:sales-forecast — Sales Forecast | Sales forecast — pipeline analysis, conversion rates, revenue projection, risk factors. 3 steps, ~15 min. |
| `mekong sales-pipeline-build` | /sales:pipeline-build — Pipeline Builder | Build complete sales pipeline — ICP profile, lead list, outreach sequences, CRM setup. 5 commands, ~30 min. |
| `mekong sales-pipeline` | /sales:sales-pipeline — Sales Pipeline Builder | Sales pipeline build — lead qualification, stage definition, scoring, CRM structure. 3 steps, ~20 min. |
| `mekong sales-proposal` | /sales:sales-proposal — Sales Proposal | Sales proposal — client needs analysis, solution design, pricing, ROI calculation. 4 steps, ~25 min. |
| `mekong sales-weekly-review` | /sales:weekly-review — Sales Weekly Review | Pipeline health, revenue tracking, weekly forecast and action items. 3 commands, ~10 min. |

---

## DEALFLOW Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong dealflow-close` | /dealflow:close — Close Deal & Onboard | Close deal — finalize investment, onboard company to portfolio. 1 command, ~5 min. |
| `mekong dealflow-diligence` | /dealflow:diligence — Due Diligence Pipeline | Run due diligence pipeline — market, team, tech, financial analysis. 1 command, ~10 min. |
| `mekong dealflow-screen` | /dealflow:screen — Deal Screening | Screen deal against investment thesis — five-factor quick eval. 1 command, ~5 min. |
| `mekong dealflow-source` | /dealflow:source — AI-Powered Deal Sourcing | AI-powered deal sourcing — scan markets, identify opportunities matching thesis. 1 command, ~8 min. |
| `mekong dealflow-term-sheet` | /dealflow:term-sheet — Generate Term Sheet | Generate term sheet draft from deal data and studio defaults. 1 command, ~8 min. |

---

## DEVREL Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong devrel-advocate` | /devrel:advocate — Developer Advocacy | Content calendar and event management |
| `mekong devrel-community` | /devrel:community — Community Management | Discord/forum management and engagement metrics |
| `mekong devrel-docs` | /devrel:docs — API Docs | API reference generation and versioning |
| `mekong devrel-onboard` | /devrel:onboard — Developer Onboard | Time-to-first-success tracking |
| `mekong devrel-sdk` | /devrel:sdk — SDK Publishing | SDK publishing and compatibility matrix |

---

## HR Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong hr-onboard` | /hr:onboard — Employee Onboarding | Employee onboarding — welcome kit → access setup → 30-60-90 plan → buddy assignment |
| `mekong hr-performance-cycle` | /hr:performance-cycle — Performance Review Cycle | Performance review cycle — self-assessment → manager review → calibration → feedback delivery |
| `mekong hr-policy` | /hr:hr-policy — HR Policy Draft | HR policy drafting — policy structure, compliance check, approval workflow. 3 steps, ~20 min. |
| `mekong hr-recruit` | /hr:recruit — Recruiting Pipeline | Recruiting pipeline — JD → sourcing → interview kit → offer template |
| `mekong hr-review` | /hr:hr-review — Performance Review | Performance review — self-assessment, peer feedback, manager evaluation, development plan. 4 steps, ~25 min. |

---

## INCIDENT Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong incident-escalate` | /incident:escalate — Escalation Engine | Automated escalation policy execution |
| `mekong incident-oncall` | /incident:oncall — On-Call Rotation | On-call rotation management and scheduling |
| `mekong incident-postmortem` | /incident:postmortem — Postmortem Generator | Structured blameless postmortem generation |
| `mekong incident-respond` | /ops:incident-respond — Incident Response | Incident response — triage, investigation, mitigation, post-mortem template. 4 steps, ~20 min. |
| `mekong incident-status` | /incident:status — Status Page | Public and internal status page management |

---

## INFRA Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong infra-gateway` | /infra:gateway — API Gateway | API gateway configuration — routes, auth, rate limiting |
| `mekong infra-network` | /infra:network — Network Audit | Network architecture audit — segmentation, firewall, DNS |
| `mekong infra-optimize` | /infra:optimize — Infra Optimize | Infrastructure cost and performance optimization |
| `mekong infra-region` | /infra:region — Region Planning | Region and edge deployment planning — latency, compliance, cost |
| `mekong infra-topology` | /infra:topology — Infra Topology | Map infrastructure topology — services, dependencies, traffic |

---

## INTL Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong intl-compliance` | /intl:compliance — Country Compliance | Country-specific regulatory requirements |
| `mekong intl-entity` | /intl:entity — International Entity | International entity setup and tax structuring |
| `mekong intl-localize` | /intl:localize — Localization | i18n pipeline and translation management |
| `mekong intl-market-assess` | /intl:market-assess — Market Assessment | Market entry analysis per country |
| `mekong intl-pricing` | /intl:pricing — Geo Pricing | Geo-specific pricing and PPP adjustments |

---

## MOMENTUM Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong momentum-compound` | /momentum:compound — Compound Growth | Compound growth calculator — retention curves, expansion revenue |
| `mekong momentum-network` | /momentum:network — Network Effects | Network effect analysis — density, clustering, value curves |
| `mekong momentum-resource` | /momentum:resource — Resource Allocation | Allocate resources by momentum score — invest in winners |
| `mekong momentum-velocity` | /momentum:velocity — Scaling Velocity | Track MRR growth rate, user acquisition speed, feature ship rate |
| `mekong momentum-viral-loop` | /momentum:viral-loop — Viral Loop Design | Design and measure viral loops — K-factor, cycle time |

---

## OBS Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong obs-alert` | /obs:alert — Alert Management | Alert rule creation, routing, and silencing |
| `mekong obs-dashboard` | /obs:dashboard — Observability Dashboard | Unified observability dashboard — traces + metrics + logs |
| `mekong obs-logs` | /obs:logs — Log Aggregation | Centralized log aggregation and search |
| `mekong obs-metrics` | /obs:metrics — Metrics Dashboard | Metrics collection, dashboards, and alerting |
| `mekong obs-trace` | /obs:trace — Distributed Tracing | OpenTelemetry distributed tracing setup and analysis |

---

## PRODUCT Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong product-competitive-intel` | Competitive Intelligence | Market scan + competitor deep dive + positioning strategy. 4 commands, ~25 min. |
| `mekong product-discovery` | Product Discovery Sprint | Problem → persona → solution → validation. 5 commands, ~30 min. |
| `mekong product-launch-feature` | Feature Launch Pipeline | Spec → build → test → ship → announce. 5 commands, ~40 min. |
| `mekong product-retrospective` | Sprint Retrospective | Review sprint → gather feedback → improvement plan → next sprint prep. 3 commands, ~15 min. |
| `mekong product-sprint-plan` | Sprint Planning | Backlog grooming → sprint scope → task breakdown → assignments. 4 commands, ~20 min. |

---

## TERRAIN Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong terrain-defend` | /terrain:defend — Defensive Position | Maintain and strengthen defensive market position |
| `mekong terrain-entry` | /terrain:entry — Market Entry | Market entry strategy per terrain classification |
| `mekong terrain-position` | /terrain:position — Competitive Position | Competitive positioning analysis per terrain type |
| `mekong terrain-retreat` | /terrain:retreat — Strategic Retreat | Strategic retreat and market exit criteria |
| `mekong terrain-segment` | /terrain:segment — Market Segmentation | Classify market segments using Sun Tzu terrain types |

---

## VENDOR Layer
*Total: 5 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong vendor-assess` | /vendor:assess — Vendor Assessment | Risk tiering and SOC 2 verification |
| `mekong vendor-contract` | /vendor:contract — Vendor Contracts | Centralized repository and SLA tracking |
| `mekong vendor-offboard` | /vendor:offboard — Vendor Offboard | Vendor decommissioning and data deletion |
| `mekong vendor-onboard` | /vendor:onboard — Vendor Onboard | Vendor onboarding with security questionnaire |
| `mekong vendor-spend` | /vendor:spend — Vendor Spend | License optimization and usage tracking |

---

## AE Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ae-close-report` | /ae:close-report — Close Report | Close report — win/loss analysis then CRM update. 2 commands, ~5 min. |
| `mekong ae-deal-prep` | /ae:deal-prep — Deal Prep | Deal prep — company research + competitive positioning, then proposal talking points. 3 commands, ~12 min. |
| `mekong ae-follow-up` | /ae:follow-up — Meeting Follow-Up | Meeting follow-up — follow-up email + next steps scheduled in parallel. 2 commands, ~5 min. |
| `mekong ae-outreach` | /sales:ae-outreach — Sales Outreach Sequences | Sales outreach sequences — prospect research, email drafts, follow-up cadence. 3 steps, ~15 min. |

---

## BOARD Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong board-compliance` | /board:compliance — Board Compliance | Committee composition tracking vs exchange rules |
| `mekong board-manage` | /board:manage — Board Management | Meeting scheduling, agenda, and materials preparation |
| `mekong board-minutes` | /board:minutes — Board Minutes | Meeting minutes and action item tracking |
| `mekong board-report` | /venture:board-report — Board Report | Board meeting report — KPIs, financial summary, strategic updates, risk register. 4 steps, ~30 min. |

---

## CDP Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong cdp-identity` | /cdp:identity — Identity Resolution | Cross-device identity resolution and graph |
| `mekong cdp-journey` | /cdp:journey — Journey Mapping | Customer journey mapping and optimization |
| `mekong cdp-profile` | /cdp:profile — Customer 360 | Unified customer profile across all touchpoints |
| `mekong cdp-segment` | /cdp:segment — Customer Segmentation | Dynamic customer segmentation by behavior and value |

---

## COMPLIANCE Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong compliance-check` | /compliance:compliance-check — Compliance Check | Compliance check against framework — gap identification, risk scoring, action items. 2 steps, ~15 min. |
| `mekong compliance-monitor` | /compliance:compliance-monitor — Compliance Monitor | Continuous compliance monitoring — drift detection, policy violations, alert rules. 2 steps, ~10 min. |
| `mekong compliance-soc2-prep` | /compliance:soc2-prep — SOC2 Preparation | SOC2 prep — audit, policy, IAM review, compliance report |
| `mekong compliance-sox-cycle` | /compliance:sox-cycle — SOX Compliance Cycle | Full SOX cycle — SOX testing, ITGC, risk assessment, risk report |

---

## CORPDEV Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong corpdev-evaluate` | /corpdev:evaluate — Acquisition Eval | Acqui-hire and acquisition evaluation |
| `mekong corpdev-integrate` | /corpdev:integrate — Post-Acquisition | Post-acquisition integration playbook |
| `mekong corpdev-scout` | /corpdev:scout — M&A Scout | M&A target identification |
| `mekong corpdev-synergy` | /corpdev:synergy — Synergy Tracking | Synergy tracking and integration milestones |

---

## DESIGN Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong design-sprint` | /design:sprint — Design Sprint | Design sprint — understand → sketch → decide → prototype → test |
| `mekong design-system` | /design:design-system — Design System | Design system scaffold — tokens, components, patterns, documentation. 4 steps, ~30 min. |
| `mekong design-user-research` | /design:user-research — UX Research Sprint | UX research sprint — personas → user journeys → pain points → opportunity map |
| `mekong design-wireframe` | /design:design-wireframe — Wireframe Generator | Wireframe generation — user flows, screen layouts, interaction specs. 3 steps, ~20 min. |

---

## ESG Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong esg-carbon` | /esg:carbon — Carbon Tracking | Carbon footprint tracking for Scope 1-3 |
| `mekong esg-dei` | /esg:dei — DEI Metrics | Diversity metrics and reporting |
| `mekong esg-governance` | /esg:governance — ESG Governance | ESG governance framework maintenance |
| `mekong esg-report` | /esg:report — ESG Report | Sustainability reporting with GRI/SASB frameworks |

---

## IR Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ir-calendar` | /ir:calendar — IR Calendar | Earnings calendar, quiet periods, Reg FD windows |
| `mekong ir-metrics` | /ir:metrics — Investor Metrics | Automated SaaS metrics for investors — ARR, NRR, Rule of 40 |
| `mekong ir-narrative` | /ir:narrative — S-1 Narrative | S-1 narrative development — investment thesis and MD&A |
| `mekong ir-roadshow` | /ir:roadshow — IR Roadshow | Logistics, investor targeting, and presentation versioning |

---

## RISK Layer
*Total: 4 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong risk-assess` | /risk:assess — Risk Assessment | Enterprise risk library and scoring |
| `mekong risk-fraud-detect` | /risk:fraud-detect — Fraud Detection | Anti-fraud monitoring |
| `mekong risk-monitor` | /risk:monitor — Controls Monitoring | Continuous controls monitoring |
| `mekong risk-report` | /risk:report — Risk Report | Board-ready risk reports |

---

## CONTEXT Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong context-compress` | /context:compress — Context Compress | Auto-compact and compress context to fit window |
| `mekong context-priority` | /context:priority — Context Priority | Prioritize what stays in context window under pressure |
| `mekong context-strategy` | /context:strategy — Context Strategy | Context window management — what to keep, compress, or drop |

---

## ENG Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong eng-onboard-dev` | /eng:onboard-dev — Developer Onboarding | Codebase tour → setup guide → first ticket → contribution guide for new developer |
| `mekong eng-sprint-execute` | /eng:sprint-execute — Sprint Execution | Plan parallel → implement features → test all → review → ship |
| `mekong eng-tech-debt` | /eng:tech-debt — Tech Debt Sprint | Audit → prioritize → refactor → test → verify tech debt |

---

## EXPERT Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong expert-dispatch` | /expert:dispatch — Dispatch Expert | Dispatch expert to portfolio company — create engagement record. 1 command, ~3 min. |
| `mekong expert-match` | /expert:match — Expert Matching | AI-powered expert matching — find best expert for portfolio company need. 1 command, ~5 min. |
| `mekong expert-pool` | /expert:pool — Expert Pool Management | View and manage expert pool — list, filter, stats. 1 command, ~3 min. |

---

## FINANCE Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong finance-budget-plan` | /finance:budget-plan — Budget Planning | Department budgets, financial forecast, budget allocation and approval deck. 3 commands, ~20 min. |
| `mekong finance-collections` | /finance:collections — Collections Pipeline | AR aging assessment, overdue invoice list, reminder emails, follow-up schedule. 3 commands, ~10 min. |
| `mekong finance-monthly-close` | /finance:monthly-close — Monthly Financial Close | Revenue reconcile, expense audit, P&L statement, cash flow, AR aging. 5 commands, ~25 min. |

---

## FINOPS Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong finops-budget` | /finops:budget — Cloud Budget | Cost alerts and approval workflows |
| `mekong finops-cost` | /finops:cost — Cloud Cost | Cloud cost allocation per customer and feature |
| `mekong finops-optimize` | /finops:optimize — Cloud Optimize | Reserved instance management and rightsizing |

---

## GATEWAY Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong gateway-key` | /gateway:key — API Key Management | API key provisioning, rotation, and revocation |
| `mekong gateway-rate-limit` | /gateway:rate-limit — Rate Limiting | Rate limit rule configuration per tier |
| `mekong gateway-route` | /gateway:route — Route Config | API gateway route configuration and management |

---

## GOVERNANCE Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong governance-disclosure` | /governance:disclosure — SEC Disclosure | SEC disclosure requirements tracking |
| `mekong governance-entity` | /governance:entity — Entity Management | Subsidiaries, cap table, D&O insurance tracking |
| `mekong governance-policy` | /governance:policy — Corporate Policy | Code of ethics, whistleblower, corporate guidelines |

---

## GROWTH Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong growth-channel-optimize` | /growth:channel-optimize — Channel Optimization | Channel audit, performance analysis, optimization plan. 3 commands, ~12 min. |
| `mekong growth-experiment` | /growth:experiment — Growth Experiment | Growth experiment — experiment design then metrics framework. 2 commands, ~10 min. |
| `mekong growth-metrics` | /growth:growth-metrics — Growth Metrics | Growth metrics dashboard — acquisition, activation, retention, revenue, referral. 2 steps, ~12 min. |

---

## IT Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong it-endpoint` | /it:endpoint — Endpoint Compliance | Device compliance and encryption verification |
| `mekong it-inventory` | /it:inventory — IT Inventory | SaaS discovery, license tracking, shadow IT detection |
| `mekong it-service` | /it:service — IT Service Management | IT service management — requests, incidents, changes |

---

## KB Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong kb-adr` | /kb:adr — Architecture Decision Records | Create and manage ADRs for key technical decisions |
| `mekong kb-decision` | /kb:decision — Decision Log | Log and track important business and technical decisions |
| `mekong kb-wiki` | /kb:wiki — Wiki Management | Internal wiki creation, organization, and search |

---

## LEGAL Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong legal-compliance-check` | /legal:compliance-check — Compliance Check | Compliance check — privacy policy → terms → data handling → regulatory gaps |
| `mekong legal-contract-review` | /legal:contract-review — Contract Review | Contract review — analyze contract → flag risks → suggest amendments → negotiation brief |
| `mekong legal-policy` | /legal:legal-policy — Legal Policy Draft | Legal policy creation — terms of service, privacy policy, acceptable use. 3 steps, ~25 min. |

---

## PORTFOLIO Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong portfolio-create` | /portfolio:create — Create Portfolio Company | Create new portfolio company with OpenClaw CTO instance. 1 command, ~5 min. |
| `mekong portfolio-report` | /portfolio:report — Cross-Portfolio Analytics Report | Cross-portfolio analytics — performance, patterns, intelligence. 1 command, ~8 min. |
| `mekong portfolio-status` | /portfolio:status — Portfolio Health Dashboard | Portfolio company health dashboard — metrics, momentum, alerts. 1 command, ~3 min. |

---

## SDR Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong sdr-lead-qualify` | /sdr:lead-qualify — Lead Qualify & Handoff | Lead qualify & handoff — score lead then prep AE handoff brief. 2 commands, ~8 min. |
| `mekong sdr-outreach-blast` | /sdr:outreach-blast — Outreach Blast | Outreach blast — cold emails + LinkedIn messages in parallel. 2 commands, ~8 min. |
| `mekong sdr-prospect` | /sdr:prospect — Prospecting Sprint | Prospecting sprint — ICP match + lead research in parallel. 2 commands, ~10 min. |

---

## TECH Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong tech-api-design` | /tech:api-design — API Design | Requirements → schema → OpenAPI spec → implementation plan |
| `mekong tech-architecture-review` | /tech:architecture-review — Architecture Review | API audit → schema review → dependency analysis → improvement plan |
| `mekong tech-migration` | /tech:migration — Migration Pipeline | Audit current → plan migration → generate scripts → test → verify |

---

## TREASURY Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong treasury-forecast` | /treasury:forecast — Cash Forecast | 13-week rolling cash forecast |
| `mekong treasury-invest` | /treasury:invest — Investment Policy | Short-term investment policy management |
| `mekong treasury-position` | /treasury:position — Cash Position | Daily cash position across all accounts |

---

## WORKFLOW Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong workflow-schedule` | /workflow:schedule — Scheduled Jobs | Cron and scheduled job management |
| `mekong workflow-trigger` | /workflow:trigger — Event Triggers | Event-driven workflow trigger management |
| `mekong workflow-webhook` | /workflow:webhook — Webhook Management | Incoming and outgoing webhook management |

---

## WRITER Layer
*Total: 3 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong writer-blog` | /writer:blog — Blog Pipeline | Blog pipeline — keyword research, then draft + SEO optimize in parallel. 3 commands, ~15 min. |
| `mekong writer-newsletter` | /writer:newsletter — Newsletter Pipeline | Newsletter pipeline — draft content then generate subject lines. 2 commands, ~8 min. |
| `mekong writer-social-batch` | /writer:social-batch — Social Batch | Social batch — 7-day posts + posting schedule in parallel. 2 commands, ~10 min. |

---

## ACCOUNTING Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong accounting-daily` | /accounting:daily — Daily Bookkeeping | Transaction review, categorize, reconcile, flag anomalies. 2 commands, ~8 min. |
| `mekong accounting-invoice-batch` | /accounting:invoice-batch — Invoice Batch Processing | Generate invoices, send reminders, update AR. 2 commands, ~8 min. |

---

## ANALYST Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong analyst-forecast-update` | /analyst:forecast-update — Forecast Update | Pull actuals, compare, update model, variance report. 2 commands, ~8 min. |
| `mekong analyst-report` | /analyst:report — Analyst Report | Data pull, analysis, executive summary. 2 commands, ~12 min. |

---

## BACKEND Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong backend-api-build` | /backend:api-build — API Build | Backend API build — schema, implement, test, docs. Full API cycle in 12 min |
| `mekong backend-db-task` | /backend:db-task — DB Task | Backend DB task — schema change, migration, seed, verify in 10 min |

---

## CONTENT Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong content-blog` | /content:content-blog — Blog Post Creator | Blog post creation — research, outline, draft, SEO optimization. 4 steps, ~25 min. |
| `mekong content-social` | /content:content-social — Social Media Content | Social media content — platform-specific posts, hashtags, scheduling. 3 steps, ~15 min. |

---

## DEVOPS Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong devops-deploy-pipeline` | /devops:deploy-pipeline — Deployment Pipeline | Lint → test → build → staging → smoke → production deployment pipeline |
| `mekong devops-rollback` | /devops:rollback — Emergency Rollback | Emergency rollback → smoke test → health check → incident report |

---

## ENGINEERING Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong engineering-new-service` | New Service Bootstrap | Scaffold → implement → test → deploy. New microservice from zero. 6 commands, ~45 min. |
| `mekong engineering-refactor` | Refactor Pipeline | Audit → plan → refactor → test → verify. Safe large-scale refactoring. 5 commands, ~40 min. |

---

## FACTORY Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong factory-intelligence` | /factory-intelligence — CTO Brain Intelligence Report | Show CTO brain intelligence — command effectiveness, output patterns, learning insights |
| `mekong factory-restart` | /factory-restart — Safe Factory Loop Restart | Safely restart factory loop without killing active CC CLI tasks |

---

## FRONTEND Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong frontend-responsive-fix` | /frontend:responsive-fix — Responsive Fix | Frontend responsive fix — audit breakpoints, fix issues, test viewports in 8 min |
| `mekong frontend-ui-build` | /frontend:ui-build — UI Build | Frontend UI build — component, styling, responsive, test in 12 min |

---

## INTEL Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong intel-asymmetry` | /intel:asymmetry — Info Asymmetry | Exploit information asymmetry for competitive advantage |
| `mekong intel-blind-spot` | /intel:blind-spot — Blind Spot Detection | Identify knowledge gaps and information asymmetries |

---

## IPO Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ipo-board-prep` | /ipo:board-prep — IPO Board Prep | Board prep — meeting management, metrics, risk report in parallel, then minutes |
| `mekong ipo-readiness-check` | /ipo:readiness-check — IPO Readiness Check | IPO readiness — SOX cycle, investor metrics, disclosure check, then S-1 narrative |

---

## JUNIOR Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong junior-first-task` | /junior:first-task — First Task | Junior first task — codebase overview, starter issue, guided implementation in 15 min |
| `mekong junior-learn` | /junior:learn — Learn Codebase | Junior learn — architecture overview, module deep dive, key patterns in 10 min |

---

## KE Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ke-toan-vn` | /ke-toan-vn — Kế Toán VN (Full Pack) | Kế toán VN toàn diện: hóa đơn, bút toán, MISA, báo cáo tài chính. VAS compliant. |
| `mekong ke-toan` | /ke-toan — Kế Toán Doanh Nghiệp VN | Kế toán VN: tạo hóa đơn điện tử, bút toán VAS, nhập MISA. 1 command, ~3 phút. |

---

## MATCH Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong match-founder-idea` | /match:founder-idea — Founder-Idea Matching | AI-powered founder-idea matching — pair founders with validated opportunities. 1 command, ~8 min. |
| `mekong match-vc-startup` | /match:vc-startup — VC-Startup Matching | Match VC investors to portfolio company for follow-on/co-invest. 1 command, ~5 min. |

---

## PEOPLE Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong people-offboard` | /people:offboard — Employee Offboarding | Exit checklist, access revocation, knowledge transfer. 2 commands, ~5 min. |
| `mekong people-onboard` | /people:onboard — Employee Onboarding | Welcome email, access setup, day-1 schedule. 2 commands, ~5 min. |

---

## PLATFORM Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong platform-environment-setup` | /platform:environment-setup — Environment Setup | Init → install deps → configure MCP → verify environment setup |
| `mekong platform-monitoring-setup` | /platform:monitoring-setup — Monitoring Setup | Health checks → alerts → dashboard → runbook for platform monitoring |

---

## RAAS Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong raas-create` | /raas:create — Full RaaS Product Pipeline | Create full RaaS SaaS product — scaffold, build features, deploy. 5 commands, ~45 min. |
| `mekong raas-scaffold` | /raas:scaffold — Generate RaaS SaaS Project | Scaffold new RaaS project — generates full Next.js SaaS with auth, billing, dashboard. 1 command, ~15 min. |

---

## RECRUITER Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong recruiter-screen` | /recruiter:screen — Candidate Screening | Resume analysis, score candidates, interview questions. 2 commands, ~8 min. |
| `mekong recruiter-source` | /recruiter:source — Candidate Sourcing | Job requirements, candidate search, outreach. 2 commands, ~10 min. |

---

## RELEASE Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong release-hotfix` | /release:hotfix — Hotfix Pipeline | Branch → fix → test → deploy hotfix to production |
| `mekong release-ship` | /release:ship — Ship Release | Changelog → version bump → test → tag → deploy production release |

---

## RELENG Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong releng-post-release` | /releng:post-release — Post-Release | Release post-release — smoke prod, health check, announce in 5 min |
| `mekong releng-pre-release` | /releng:pre-release — Pre-Release | Release pre-release — full test suite, changelog, version bump, tag in 10 min |

---

## REVIEW Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong review-factory` | /review:factory — Factory Loop Code Review | Full code review of factory-loop.sh — lint, logic, integration, security |
| `mekong review` | /engineering:review — Code Review | Code review — architecture check, security scan, performance analysis, improvement suggestions. 3 steps, ~15 min. |

---

## SRE Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong sre-incident` | /sre:incident — Incident Response | SRE incident — triage, mitigate, verify, report in 10 min |
| `mekong sre-morning-check` | /sre:morning-check — Morning Check | SRE morning check — health, status, benchmark in parallel, 5 min |

---

## UI Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ui-design-component` | /ui:design-component — Component Design & Build | Spec, design, implement, responsive check. 2 commands, ~12 min. |
| `mekong ui-design-review` | /ui:design-review — Design Review | Audit components, check consistency, flag issues. 2 commands, ~8 min. |

---

## UX Layer
*Total: 2 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ux-interview` | /ux:interview — UX Interview | Interview script, discussion guide, insight synthesis. 2 commands, ~10 min. |
| `mekong ux-usability` | /ux:usability — Usability Test | Usability test — test plan, task scenarios, findings, recommendations in 10 min |

---

## 4 Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong 4-project` | Tứ Đại Chiến — 4 Projects Parallel | Tứ Đại Chiến — 4 projects parallel dispatch. Start master view, dispatch missions, monitor status. |

---

## ANTIBRIDGE Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong antibridge` | /antibridge Command | Access AntiBridge skill for mobile AI agent control |

---

## APPROVE Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong approve` | /approve Command | Approve pending content, decisions, or deployments |

---

## BHXH Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong bhxh` | /bhxh — Bảo Hiểm Xã Hội | Tạo file khai BHXH/BHYT/BHTN mẫu D02-TS. Offline, user tự upload lên bhxh.gov.vn. |

---

## BRAIN Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong brain-evolution-log` | /brain-evolution-log — Brain Evolution History | Show CTO brain evolution history — what it learned over time, strategy changes |

---

## BRIDGE Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong bridge` | Bridge Command | Unified bridge for all AgencyOS CLI tools |

---

## CLOUDFLARE Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong cloudflare` | /cloudflare Command | Access Cloudflare skill for edge computing, serverless, storage, and AI |

---

## CODE Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong code` | /engineering:code — Code Generator | Code generation from spec — architecture, implementation, tests. 3 steps, ~20 min. |

---

## COMMANDS Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong commands-status` | /commands-status — Command Health Dashboard | Show command health — dispatch count, success rate, avg duration from factory-metrics.log |

---

## COOK Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong cook` | /core:cook — Recipe Runner | Recipe executor — run a multi-step DAG recipe from recipes/ directory. 1 step, variable time. |

---

## DAILY Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong daily` | /daily Command | Get daily status report from Agentic Overlord |

---

## DEPLOY Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong deploy` | /devops:deploy — Deploy | Deployment execution — pre-flight checks, deploy, smoke test, rollback plan. 4 steps, ~15 min. |

---

## ESCALATION Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong escalation-map` | /escalation:map — Escalation Policy | OpenClaw Escalation Policy — all commands mapped to L0-L3 autonomy levels |

---

## GEMINI Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong gemini` | Gemini Command | Control Gemini CLI with rate limiting and retry logic |

---

## IDEA Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong idea` | /idea — Agentic BizPlan OS: Zero→IPO Company Architecture Generator | MANDATORY first step — Generate full company architecture from a business idea before OpenClaw runs the 5-layer command system. Zero→IPO Agentic BizPlan OS. |

---

## KINH Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong kinh-doanh-vn` | /kinh-doanh-vn — Kinh Doanh & CRM VN | Kinh doanh VN: CRM, đơn hàng, khách hàng, báo cáo doanh số. SME focused. |

---

## MODEL Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong model-matrix` | /model-matrix — Model Capabilities & Routing | Show model capabilities matrix — which model for which task type |

---

## OPUS Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong opus-tomhum-orchestrator` | /opus-tomhum-orchestrator — Tôm Hùm Team Full-Stack Builder | Opus Tôm Hùm Team — Self-orchestrate as 5-department company. Builds full-stack code multi-threaded. 30+ credits, ~90 min. |

---

## PHAP Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong phap-ly-vn` | /phap-ly-vn — Pháp Lý & Tuân Thủ VN | Pháp lý VN: hợp đồng, giấy phép, tuân thủ, tranh chấp. SME & OPC focused. |

---

## PLAN Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong plan` | Plan — Implementation Planning | Create implementation plan with research and analysis |

---

## PRODUCTION Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong production-status` | /production-status — Live Production Board | Live production board — project states, ROI scores, next planned dispatch, session stats |

---

## PROJECT Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong project-matrix` | /project-matrix — Project Priority Ranking | Show project priority matrix — ranked by business impact (ROI + maturity + activity) |

---

## QUICK Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong quick-start` | 🚀 Quick Start: New Project in 5 Commands | Start any new project from idea to production in 5 commands |

---

## SDLC Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong sdlc` | /sdlc — Agentic SDLC Orchestrator | 4-phase AI-SDLC scaffold — Spec → Design → Code → Deploy. Run a feature through the full agentic lifecycle. ~30-90min total depending on feature scope. |

---

## SECURITY Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong security-scan` | /security:security-scan — Security Scan | Security scan — vulnerability assessment, dependency audit, configuration review. 3 steps, ~15 min. |

---

## SHIP Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong ship` | 🚀 Ship Command | Ship code to production - test, commit, push, deploy |

---

## TAI Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong tai-chinh-vn` | /tai-chinh-vn — Tài Chính & Đầu Tư VN | Tài chính VN: dòng tiền, định giá, vay vốn, phân tích tài chính. SME focused. |

---

## TEST Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong test` | /engineering:test — Test Generator | Test generation — unit tests, integration tests, edge cases, coverage report. 3 steps, ~15 min. |

---

## THUE Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong thue-dnvn` | /thue-dnvn — Thuế Doanh Nghiệp Việt Nam | Tính thuế VN: TNCN lũy tiến, TNDN, GTGT, xuất file HTKK. Offline, không cần API. |

---

## VAN Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong van-hanh-vn` | /van-hanh-vn — Vận Hành & Nhân Sự VN | Vận hành VN: nhân sự, BHXH, kho hàng, lịch làm việc. SME focused. |

---

## VERCEL Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong vercel-debug` | /vercel-debug — Vercel CI/CD Debugging Workflow | Debug Vercel CI/CD deployments — check status, fix errors, verify production GREEN |

---

## VIETQR Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong vietqr` | /vietqr — VietQR Thanh Toán QR | Tạo QR code VietQR chuẩn VN cho thanh toán ngân hàng. 40+ ngân hàng hỗ trợ. |

---

## ZALO Layer
*Total: 1 commands*

| Command Name | Title / Invocation | Description |
|--------------|--------------------|-------------|
| `mekong zalo-oa` | /zalo-oa — Zalo Official Account Marketing | Zalo OA: viết caption VN, lên lịch broadcast, phân tích followers. Cần OA Access Token. |

---

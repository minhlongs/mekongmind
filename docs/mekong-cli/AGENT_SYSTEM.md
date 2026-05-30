# 📚 Mekong AGI v2 Agent System & Water Protocol (水)

This document provides a comprehensive guide to the agent harness structure, context flow mechanics, multi-agent collaboration, and execution pipeline of Mekong CLI.

---

## 1. The 6 Execution Layers & Mappings

Mekong CLI organizes agent operations into **6 primary execution layers** as defined in [AGENTS.md](file:///Users/macbook/mekong-cli/AGENTS.md). These match the user's operational workflows and map to the 10 organizational layers and the 13 Binh Pháp verticals.

### Execution Layer Hierarchy
1. **Studio**: Venture studio management, portfolio allocation, and ROI dashboard execution.
2. **Founder**: Strategic calculations, fundraising planning, OKR management, and runway forecasting.
3. **Business**: Operational execution, sales pipelines, billing tracking, marketing campaigns, and HR.
4. **Product**: Feature design, sprint planning, backlog prioritization, user research, and estimation.
5. **Engineering**: PEV code generation, test design, bug fixing, deployment gates, and system code reviews.
6. **Ops**: System health sweeps, incident response tracking, logs analysis, and disaster recovery.

### Layer & Vertical Mapping Matrix

| Execution Layer | Organizational Layers (10) | Mapped Binh Pháp Verticals | Mapped CLI commands |
| :--- | :--- | :--- | :--- |
| **Studio** | Studio | MekongStudio, MekongHQ | `/studio-bootstrap`, `/studio-roi` |
| **Founder** | Founder, PM | MekongLaunch, MekongVault, MekongCounsel | `/swot`, `/annual`, `/raise` |
| **Business** | Business | MekongPay, CashClaw, MekongPulse | `/sales`, `/marketing`, `/finance` |
| **Product** | Product, PM | MekongMind | `/plan`, `/brainstorm`, `/scope` |
| **Engineering** | Engineering, Dev, Worker | MekongBridge, MekongForce | `/cook`, `/code`, `/test` |
| **Ops** | Ops, Worker | MekongEye, MekongMap | `/health`, `/security`, `/status` |

---

## 2. Water Protocol (水) Context Flow

When multiple agents collaborate to achieve a goal, context must flow seamlessly rather than forcing each agent to start from scratch. The **Water Protocol (水)** implements this via [ContextFlow](file:///Users/macbook/mekong-cli/src/core/context_flow.py).

### Core Flow Mechanics
- **Contribution Accrual:** Each agent's response is captured as an `AgentContribution` containing their role, status, output, and concerns.
- **Output Capping:** Outputs are capped at **3,000 characters** in memory and **1,500 characters** in final contexts to prevent prompt token bloat and save context window costs.
- **Context Injection:** When dispatching subsequent agents, the system builds an enriched context prompt containing prior outputs.
- **Blocker Detection:** If any agent transitions to a `BLOCKED` status, the execution loop immediately halts, refunds outstanding MCUs, and logs the blocker details.

```
Goal: "Analyze Q1 financials, write blog draft, and proofread it"
  │
  ├──► Agent [CFO] dispatches: Calculates cash flows and ARR metrics.
  │     │ (Status: DONE)
  │     ▼
  │   Water Protocol collects output (CFO contribution cached)
  │     ▼
  │  Enriched User Prompt: CFO data + Goal instructions
  │     ▼
  ├──► Agent [CMO] dispatches: Writes marketing announcement based on CFO ARR metrics.
  │     │ (Status: DONE)
  │     ▼
  │   Water Protocol collects output (CMO contribution cached)
  │     ▼
  │  Enriched User Prompt: CFO + CMO data + Goal instructions
  │     ▼
  └──► Agent [Editor] dispatches: Performs copy-editing and proofreading on the draft.
```

---

## 3. Multi-Agent Collaboration Patterns

Mekong CLI automatically detects goals requiring collaborative agent pipelines. Registered patterns in [task_classifier.py](file:///Users/macbook/mekong-cli/src/core/task_classifier.py) trigger sequential multi-agent execution:

| Detected Goal Pattern | Collaborative Agent Sequence | Operational Purpose |
| :--- | :--- | :--- |
| `revenue report` | `["cfo", "data"]` | Revenue calculations backed by raw data analysis |
| `content about financials` | `["cfo", "cmo"]` | CFO ARR metrics translated into blog announcements |
| `deploy and monitor` | `["cto", "coo"]` | Code compilation followed by server health deployment checks |
| `sales report` | `["sales", "data"]` | Conversion analytics mapped against raw transaction metrics |
| `technical blog` | `["cto", "editor"]` | Engineering architecture drafts polished for external publication |
| `customer churn analysis` | `["cs", "cfo", "data"]` | Customer support transcripts joined with financial metrics |
| `product launch` | `["cmo", "cto", "sales"]` | Launch page setup, core functionality build, and marketing hook |
| `incident response` | `["coo", "cto"]` | Ops server recovery paired with developer patches |
| `onboard customer` | `["cs", "sales"]` | Customer walkthrough setup coupled with upgrade pricing |
| `investor update` | `["cfo", "cmo", "editor"]` | P&L metrics and product wins formatted into a newsletter |

---

## 4. Universal LLM & Fallback Chain

Mekong CLI is designed to run against any OpenAI-compatible API without vendor lock-in.

### Configuration Environment Variables
Set these three environment variables to configure your provider:
- `LLM_BASE_URL`: Endpoint of the provider (e.g., `https://api.anthropic.com/v1`, `https://openrouter.ai/api/v1`, or `http://localhost:11434/v1`).
- `LLM_API_KEY`: API access token.
- `LLM_MODEL`: Target model identifier (e.g., `anthropic/claude-3.5-sonnet`, `gpt-4o`, `qwen2.5-coder`).

### Provider Fallback Loop
When a model fails due to rate limits, timeout, or network issues, the routing layer shifts along the fallback chain:
```
OpenRouter ──► DashScope ──► DeepSeek ──► Anthropic ──► OpenAI ──► Google ──► Ollama (Local)
```

---

## 5. The 9-Stage Hybrid Routing Pipeline

Every mission executed by Mekong CLI flows through a structured 9-stage lifecycle in the [hybrid_router.py](file:///Users/macbook/mekong-cli/src/core/hybrid_router.py) orchestrator:

```
  ┌────────────────────────────────────────────────────────┐
  │ 1. CLASSIFY     Task & multi-agent mapping             │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. MATCH        Check for commands in `.claude/`       │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. LOCK         Gate verification & MCU reservation    │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 4. SELECT MODEL Tier-aware selection (cheap/reasoning)  │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 5. ENRICH       Inject Agent system prompt + Hub info  │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 6. EXECUTE      Run agents sequentially/fallbacks      │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 7. REVIEW       SubagentReviewer checks requirements   │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 8. CONFIRM      Final MCU billing (Charge or Refund)   │
  └───────────────────────────┬────────────────────────────┘
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │ 9. EMIT         Watermark injection (if free tier)     │
  └────────────────────────────────────────────────────────┘
```

1. **Classify:** Classify task complexity, operational domain, required MCU cost, and check for multi-agent execution patterns.
2. **Match:** Look up target command matching definitions in `.claude/commands/*.md` to inject specific instructions.
3. **Lock:** Check client MCU credits, reservation lock of cost.
4. **Select Model:** Match tier request. Mechanical tasks (simple) are routed to cheap models; reasoning tasks require senior models.
5. **Enrich:** Inject core agent prompt (`agents/{role}.md` or default) and load domain expertise from departments (`packages/agents/hubs/{role}-hub.md`).
6. **Execute:** Dispatch execute loops with fallbacks. If multi-agent, accumulate context via `ContextFlow`.
7. **Review:** Invoke post-execution verification using `SubagentReviewer` to check if requirements are satisfied.
8. **Confirm:** Deduct reserved MCU from tenant balance or issue a refund if the pipeline failed or was blocked.
9. **Emit:** Inject the free-tier distribution watermark link to the final output if tenant credits are below threshold.

---

## 6. Core Subcommand Modules

Mekong CLI provides dedicated subcommand groups for strategic and tactical execution.

### Binh Pháp Subcommands (`mekong binh-phap`)
- `status`: Show current 3D topology coordinate state (dimension, cycle, and active groups).
- `dispatch`: Query the next strategic command to execute according to current topology coordinates.
- `chapters`: Display the mapping of the 13 Binh Pháp chapters to available CLI commands.
- `learn`: Log a strategic lesson from the current execution cycle into memory.
- `immortal`/`monitor`: Start the infinite loop supervisor keeping standard checks active.
- `daemon`: Launch the background dispatcher loop optimized for M1 Max machines.

### BMAD Subcommands (`mekong bmad`)
- `list`: View all local BMAD workflows configured in your workspace.
- `info`: Display detail properties and dependency parameters of a specific workflow.
- `catalog`: Rebuild and cache the active workflow catalog list.
- `search`: Search for specific workflows matching name queries.
- `run`: Trigger execution of the target BMAD workflow sequence.

### SDLC Sub-apps
The platform features an automated SDLC scaffold for structured features:
- `mekong spec`: Translate raw feature requests into formal technical specifications.
- `mekong design`: Map specifications into modular architecture blueprints.
- `mekong code`: Parse design blueprints to generate structured file tasks.
- `mekong deploy`: Verify compliance gates and deploy the application.

---
_Last Updated: May 2026 | Source: `src/core/` implementation_

# MekongMind Marketing Metrics & KPIs

This document establishes the telemetry, acquisition tracking, and goals for MekongMind's go-to-market performance.

---

## 1. Key Performance Indicators (KPIs)

We track performance across 3 distinct phases:

| Metric Category | Month 1 Goal | Month 3 Goal | Month 6 Goal | Tracking Tools |
| :--- | :--- | :--- | :--- | :--- |
| **CLI Installations** | 500 installs | 2,500 installs | 10,000+ installs | npm / PyPI telemetry |
| **Active MCP Servers** | 100 active hosts | 800 active hosts | 3,000+ active hosts | Opt-in telemetry pings |
| **GitHub Stars** | 300 stars | 1,200 stars | 5,000+ stars | GitHub API |
| **Documentation traffic**| 5,000 pageviews | 20,000 pageviews | 80,000+ pageviews | Plausible Analytics |
| **Cloud Conversion** | 2% conversion | 4% conversion | 6% conversion | Stripe / Polar webhook telemetry |
| **Community Size** | 200 developers | 1,000 developers | 3,500+ developers | Discord / Slack hooks |

---

## 2. Dev-Activation Funnel

```text
[ Acquisition ] -> Blog post / GitHub / Hacker News
        ↓
[ Activation  ] -> Runs "pip install -e ." & "mekong doctor check" (Local setup success)
        ↓
[ Engagement  ] -> Connects CheetahClaws to a custom agent workspace
        ↓
[ Retention   ] -> Launches the CLI at least 3 days/week
        ↓
[ Referral    ] -> Submits a PR or writes an MCP tool plugin for the registry
        ↓
[ Revenue     ] -> Subgrades to MekongMind Cloud for managed persistent servers
```

---

## 3. Telemetry Event Collection Spec
To measure activation without violating developer privacy, we track anonymous CLI pings:
* `mekong_cli_init`: Fired when `pip install -e .` completes and `mekong` commands are first invoked.
* `mekong_doctor_success`: Fired when the check passes (critical diagnostic validation).
* `mekong_mcp_started`: Fired when `mekong ai-os start` runs, indicating server deployment.
* *Note: No code contents, keys, or directories are ever sent in telemetry pings.*

# MekongMind Promotional Campaigns & Launch Playbook

This document details the core promotional campaigns, launch sequences, and special discount structures for the rollout of **MekongMind**.

---

## 1. Product Hunt & Hacker News Launch Sequence

### Product Hunt Strategy
* **Launch Date**: Tuesday (High traffic, optimal for business software).
* **Tagline**: *"Run your entire business as a coordinated network of AI agents"*
* **Pricing Offer**: 30% off the Developer/Pro tiers for the first 3 months using code `PHLAUNCH30`.
* **Launch Assets**:
  * **Video**: A 90-second video showing the local CLI (`pip install -e .`) initiating a multi-agent workspace, executing tasks, and verifying output.
  * **Screenshots**: Clean screenshots of the terminal, the agent interaction logs, and the dashboard.

### Hacker News Launch
* **Format**: Show HN post.
* **Title**: *Show HN: MekongMind – A unified AI operating system with 6-layer agent orchestration*
* **Post Content**:
  > Hi HN!
  >
  > We've been building MekongMind because we got tired of context drift in multi-agent networks. CrewAI and LangGraph are great, but managing states, memory, and routing across organizational layers (Product, Engineering, Business, Ops) became a nightmare.
  >
  > To solve this, we created the **Water Protocol (水)** for context propagation and the **CheetahClaws** engine. It runs locally as a Typer-based CLI or spins up an MCP server with 25+ native tools (`cc_memory_search`, `cc_tasks_create`, etc.).
  >
  > It is fully open-source (BSL 1.1) and handles OpenAI, Anthropic, Gemini, and DeepSeek backends using just three environment variables.
  >
  > We'd love to hear your feedback on the architecture and our tool interface!
  >
  > Repository: github.com/mekongmind/mekongmind

---

## 2. Developer Beta Campaign (Email Sequence)

### Email 1: The Invitation (Send to Waitlist)
* **Subject**: Welcome to the future of agentic operations: MekongMind Beta 🚀
* **Body**:
  ```text
  Hi {{Developer_Name}},

  You are receiving this because you signed up for the MekongMind waitlist. We are thrilled to invite you to our developer beta!

  MekongMind is not just another agent framework. It is a complete Unified AI Operating System that orchestrates 6 separate organizational layers (Studio, Founder, Business, Product, Engineering, Ops) using the Water Protocol (水) to keep agent contexts perfectly aligned.

  To get started:
  1. Clone our repository: git clone https://github.com/mekongmind/mekongmind
  2. Setup the CLI: pip install -e .
  3. Run the doctor command: mekong doctor check

  We've loaded your account with $20 in free cloud execution credits. Try building a custom MCP tool today and let us know what you think in our Discord!

  Cheers,
  The MekongMind Team
  ```

### Email 2: Technical Deep Dive (Send Day 3)
* **Subject**: How the Water Protocol (水) prevents AI agent context-drift 🌊
* **Body**:
  ```text
  Hi {{Developer_Name}},

  Most multi-agent pipelines lose their minds after 5 turns. Why? Because context gets polluted or lost.

  In MekongMind, the Water Protocol (水) flows context bidirectionally between layers. When your 'Product' agent changes a spec, the update automatically hydrates the context of the 'Engineering' and 'Ops' agents.

  In this guide, we show you how to write custom adapters and hook them into CheetahClaws to build resilient workflows:
  👉 [Read the guide: mekongmind.com/docs/water-protocol]

  Have you run `mekong doctor check` yet? Let us know if you hit any bumps.

  Best,
  MekongMind Engineering
  ```

### Email 3: Special Launch Offer (Send Day 7)
* **Subject**: Ready to scale? Save 30% on MekongMind Cloud 💳
* **Body**:
  ```text
  Hi {{Developer_Name}},

  Now that you've experienced MekongMind locally, it's time to scale up. 

  With MekongMind Cloud, you get:
  * Persistent, hosted CheetahClaws MCP servers.
  * Real-time monitoring and event tracing.
  * Native integrations with Polar, Stripe, Paddle, and VietQR (SePay) to let your agents trigger transactions.

  Upgrade to our Developer Plan today and get 30% off your first 3 months with code: CLOUD30.

  👉 [Upgrade now: mekongmind.com/pricing]

  Best,
  The MekongMind Team
  ```

---

## 3. Referral & Loyalty Campaign (Creem / Polar / Stripe integrations)
We leverage Polar & Creem licensing structures to reward developers who build and share MekongMind packages.
* **Developer Incentives**: Builders receive a 15% commission on any Cloud customer they refer through their custom plugin/adapter.
* **Discount Code Structure**:
  * `DEVVIP`: 50% discount for open-source contributors who submit a merged pull request.
  * `MEKONG50`: 50% off for the first 100 developers joining from regional Vietnamese developer networks.

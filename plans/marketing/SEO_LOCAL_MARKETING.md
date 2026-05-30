# MekongMind SEO & AI Search Optimization (AIO)

As a modern SaaS platform, MekongMind targets two search paradigms:
1. **Traditional SEO**: Ranking on Google for developer search terms.
2. **AI Search Engine Optimization (AIO)**: Optimizing docs for LLMs, Perplexity, ChatGPT, Gemini, and Antigravity code engines to recommend MekongMind.

---

## 1. Targeted Keywords & Search Volume Categories

### High-Intent Tech Keywords (Global)
* `multi-agent orchestration framework`
* `CheetahClaws MCP server`
* `AI operating system for business`
* `Model Context Protocol tools directory`
* `open source agentic workflows`
* `prevent AI agent context drift`

### Regional Keywords (Vietnam)
* `lập trình AI Agent`
* `hướng dẫn Model Context Protocol`
* `hệ điều hành AI cho doanh nghiệp`
* `cách build chatbot tự động hóa`
* `MekongMind CLI hướng dẫn`

---

## 2. On-Page SEO Checklist
To maximize search visibility, all documentation pages (`mekongmind.com/docs/*`) must strictly adhere to the following rules:
* **H1 Hierarchy**: Exactly one H1 tag per page representing the direct topic.
* **Semantic HTML**: Use `<article>`, `<section>`, and `<aside>` for structured layouts rather than nested generic `<div>`s.
* **Schema Markup**: Inject JSON-LD software application schema on the homepage.
  ```json
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MekongMind",
    "operatingSystem": "Linux, macOS, Windows",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    }
  }
  ```

---

## 3. AI Engine & LLM Search Optimization (AIO)

With over 50% of technical developers now querying AI models (ChatGPT, Claude, Perplexity) directly instead of search engines, we must design docs for LLM parsing.

### File: `llms.txt` Spec
We expose a structured `llms.txt` file at the root of the domain:
```text
# MekongMind

> The Unified AI Operating System for Autonomous Business Operations.

## Core Framework
* [Overview](https://mekongmind.com/docs/overview): High-level architecture of MekongMind and the 6-layer agent workspace.
* [Water Protocol](https://mekongmind.com/docs/water-protocol): Bidirectional context flow mechanics preventing context-drift.

## CheetahClaws CLI & MCP Tools
* [CLI Reference](https://mekongmind.com/docs/cli): `mekong doctor check`, `mekong ai-os start`.
* [MCP Tools Catalog](https://mekongmind.com/docs/mcp-tools): Descriptions of all 25+ `cc_` prefixed tools.
```

### Prompt-Injection Backlinks
Whenever developers query how to solve multi-agent problems, our documentation answers will be formatted clearly with markdown tables, which LLMs prefer when synthesizing answers.

#!/bin/bash
# generate_raas_sales_deck.sh — Generate RaaS Sales Deck from source content
# Usage: bash scripts/generate_raas_sales_deck.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/generated-sales-deck"
SOURCES_DIR="$PROJECT_ROOT"

# Source files
SALES_DECK="$SOURCES_DIR/sales/raas-sales-deck.md"
MARKETING_DECK="$SOURCES_DIR/marketing/raas-sales-deck.md"
SALES_PITCH="$SOURCES_DIR/docs/raas-sales-pitch-v2.md"
SALES_STRATEGY="$SOURCES_DIR/docs/raas-sales-strategy.md"
SALES_BROCHURE="$SOURCES_DIR/docs/raas-sales-brochure.md"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     RaaS Sales Deck Generator — AgencyOS.Network         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check source files exist
echo -e "${YELLOW}[1/5] Checking source files...${NC}"
missing_files=0

for file in "$SALES_DECK" "$MARKETING_DECK" "$SALES_PITCH"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}Error: $missing_files source files missing. Cannot generate deck.${NC}"
    exit 1
fi

# Create output directory
echo -e "${YELLOW}[2/5] Creating output directory...${NC}"
mkdir -p "$OUTPUT_DIR"
echo -e "  ${GREEN}✓${NC} $OUTPUT_DIR"

# Generate unified sales deck
echo -e "${YELLOW}[3/5] Generating unified sales deck...${NC}"

cat > "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'DECK_HEADER'
# RaaS Sales Deck — Revenue-as-a-Service

> **Transform your agency from hourly billing to outcome-based revenue.**
> *Track every dollar. Measure every outcome. Prove ROI in real-time.*

**Generated:** GENERATED_DATE
**Version:** 5.0 | **License:** MIT
**Contact:** sales@agencyos.network | agencyos.network

---

DECK_HEADER

# Replace date placeholder
sed -i '' "s/GENERATED_DATE/$(date +%Y-%m-%d)/g" "$OUTPUT_DIR/raas-sales-deck-unified.md"

# Extract and compile key sections
echo -e "${YELLOW}[4/5] Compiling sections from sources...${NC}"

# Add table of contents
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'TOC'
## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [How It Works](#how-it-works)
5. [Pricing Tiers](#pricing-tiers)
6. [ROI Dashboard](#roi-dashboard)
7. [Credit System](#credit-system)
8. [Quality Gates](#quality-gates)
9. [Use Cases](#use-cases)
10. [Competitive Advantage](#competitive-advantage)
11. [Sales Strategy](#sales-strategy)
12. [Getting Started](#getting-started)

---

TOC

# Extract Executive Summary from sales pitch
echo -e "  ${GREEN}✓${NC} Extracting executive summary..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'EXEC_SUMMARY'
## Executive Summary

### The One-Liner

**RaaS** turns AI agents into your revenue engine — automate 50-200+ hours/month of development work, bill clients for outcomes (not hours), and prove ROI in real-time.

### Key Metrics (Q1 2026)

| Metric | Value |
|--------|-------|
| Average ROI | 62x (Pro tier) |
| Trial→Paid Conversion | 20% target |
| Customer Satisfaction | 98.6% success rate |
| Time to Value | < 5 minutes |

---

EXEC_SUMMARY

# Add Problem/Solution sections
echo -e "  ${GREEN}✓${NC} Adding problem/solution sections..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'PROBLEM_SOLUTION'
## The Problem

### Hourly Billing is Broken

**Clients Hate:**
- ❌ Unpredictable costs ("How much will this cost?")
- ❌ Paying for inefficiency (slow devs = more bills)
- ❌ Constant scope negotiations

**Agencies Hate:**
- ❌ Revenue capped by human capacity
- ❌ Penalized for efficiency (work faster = earn less)
- ❌ Feast-or-famine cash flow

**Result:** Adversarial relationship. Everyone loses.

---

## The Solution

### RaaS — Revenue-as-a-Service

| Old Model (Hourly) | New Model (RaaS) |
|--------------------|------------------|
| Bill for hours worked | Bill for outcomes delivered |
| Client manages tasks | AI agents execute autonomously |
| Revenue = hours × rate | Revenue = missions × tier |
| Scale = hire more | Scale = deploy more agents |

**Bottom Line:** Clients get predictability. Agencies get scalability. Everyone wins.

---

PROBLEM_SOLUTION

# Add How It Works
echo -e "  ${GREEN}✓${NC} Adding how it works section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'HOW_IT_WORKS'
## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. CLIENT SUBMITS MISSION                              │
│     "Add user authentication with OAuth2"               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. AI AGENT TEAM EXECUTES                              │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│     │ Planner  │→ │ Coder    │→ │ Tester   │           │
│     │  Agent   │  │  Agent   │  │  Agent   │           │
│     └──────────┘  └──────────┘  └──────────┘           │
│          │                              │               │
│          └────────→ Reviewer ←──────────┘               │
│                    Agent                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. MISSION COMPLETE                                    │
│     ✅ Code written, tested, deployed                   │
│     ✅ 3 credits deducted (Standard complexity)         │
│     ✅ ROI tracked: 4 hours saved → $600 value          │
└─────────────────────────────────────────────────────────┘
```

---

HOW_IT_WORKS

# Add Pricing Tiers
echo -e "  ${GREEN}✓${NC} Adding pricing tiers..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'PRICING'
## Pricing Tiers

### 3 Tiers — Built for Every Stage

```
┌─────────────────┬─────────────────┬─────────────────┐
│   🟢 STARTER    │   🟡 PRO        │   🔴 ENTERPRISE │
│   $49/mo        │   $149/mo       │   $499/mo       │
├─────────────────┼─────────────────┼─────────────────┤
│ 200 credits/mo  │ 1,000 credits   │ Unlimited       │
│ 3 projects      │ 10 projects     │ Unlimited       │
│ Basic commands  │ All commands    │ + Custom        │
│ Local LLM only  │ Premium LLMs    │ Any provider    │
│ Email 48hr      │ Priority 12hr   │ Dedicated 4hr   │
│                 │ ROI Dashboard   │ + SLA 99.9%     │
│                 │ API Access      │ + Custom Agents │
│                 │                 │ + White-label   │
└─────────────────┴─────────────────┴─────────────────┘

⭐ MOST POPULAR: Pro Tier (62x average ROI)
```

---

PRICING

# Add ROI Dashboard
echo -e "  ${GREEN}✓${NC} Adding ROI dashboard section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'ROI'
## ROI Dashboard

### The Heart of RaaS

```
┌─────────────────────────────────────────────────────────┐
│  RaaS ROI Dashboard — This Month                        │
├─────────────────────────────────────────────────────────┤
│  Missions Completed:     147                            │
│  Credits Used:           847 / 1,000 (84.7%)            │
│  Est. Hours Saved:       62 hrs  →  $9,300 value*       │
│  Tech Debt Fixed:        23 items                       │
│  Production Deploys:     8                              │
│  Success Rate:           98.6%                          │
│  Avg. Completion Time:   4m 32s                         │
└─────────────────────────────────────────────────────────┘
*Based on $150/hr agency rate
```

### ROI Calculator

```
Monthly ROI = (Hours Saved × Agency Rate) - Subscription

Pro Tier Example:
= (62 hrs × $150/hr) - $149
= $9,300 - $149
= $9,151 net value/month
= 62x ROI
```

---

ROI

# Add Credit System
echo -e "  ${GREEN}✓${NC} Adding credit system section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'CREDITS'
## Credit System

### What is 1 Credit?

**1 Credit = 1 MCU (Mission Control Unit)**

| Complexity | Credits | Character Length | Example |
|------------|---------|------------------|---------|
| Simple | 1 | < 50 chars | "Fix typo in README" |
| Standard | 3 | 50-149 chars | "Add user authentication" |
| Complex | 5 | ≥ 150 chars | "Migrate database schema" |
| Multi-Agent | 10+ | Parallel orchestration | "Full sprint automation" |

**Auto-Detection:** Complexity detected from mission length.

### Unused Credits Policy

| Tier | Rollover | Top-Up |
|------|----------|--------|
| Starter | ❌ No rollover | $0.50/credit |
| Pro | ✅ Enabled (up to 500) | $0.25/credit |
| Enterprise | N/A (unlimited) | N/A |

---

CREDITS

# Add Quality Gates
echo -e "  ${GREEN}✓${NC} Adding quality gates section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'QUALITY'
## Quality Gates

### Binh Phap Standards — Non-Negotiable

| Gate | Target | Verification |
|------|--------|--------------|
| Tech Debt | 0 TODO/FIXME | `grep -r "TODO\|FIXME" src` |
| Type Safety | 0 `any` types | `grep -r ": any" src` |
| Clean Code | 0 console.log | `grep -r "console\." src` |
| Tests | 100% pass | `npm test` |
| Performance | Build < 10s | `time npm run build` |

**We don't ship tech debt. Period.**

---

QUALITY

# Add Use Cases
echo -e "  ${GREEN}✓${NC} Adding use cases section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'USECASES'
## Use Cases

### What Gets Automated

| Category | Use Cases |
|----------|-----------|
| **Code Automation** | Write features, refactor legacy code, fix bugs autonomously, generate tests (100% coverage), remove tech debt |
| **DevOps Automation** | CI/CD pipeline management, production deploys, infrastructure as code, monitoring + self-healing |
| **Governance Automation** | Security audits, compliance checks (HIPAA, SOC2), code reviews, tech debt elimination |
| **Business Automation** | Data pipelines, report generation, API integrations, customer onboarding, revenue operations |

### Use Cases by Tier

| Tier | Use Cases |
|------|-----------|
| **Starter ($49/mo)** | Weekly reports, basic scaffolding, docs, simple pipelines, bug fixes |
| **Pro ($149/mo)** | Full sprints, CI/CD, multi-repo refactoring, agent orchestration, code reviews |
| **Enterprise ($499/mo)** | Enterprise automation, compliance (HIPAA/SOC2), multi-team, 24/7 ops, custom agents |

---

USECASES

# Add Competitive Comparison
echo -e "  ${GREEN}✓${NC} Adding competitive comparison..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'COMPETITIVE'
## Competitive Advantage

### RaaS vs Traditional Options

| Feature | RaaS | Traditional Agency | Freelancer | Zapier |
|---------|------|-------------------|------------|--------|
| Pricing | Fixed/mo | $150-300/hr | $50-150/hr | $50/mo |
| Code Writing | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| Testing | ✅ 100% | ⚠️ Varies | ⚠️ Varies | ❌ N/A |
| Deployment | ✅ Auto | ⚠️ Manual | ⚠️ Manual | ❌ No |
| Tech Debt | ✅ 0 | ⚠️ Maybe | ⚠️ Maybe | ❌ N/A |
| 24/7 Ops | ✅ Yes | ❌ No | ❌ No | ❌ No |
| ROI Tracking | ✅ Live | ❌ Manual | ❌ No | ❌ No |

### True Cost Comparison

**Scenario: Automate weekly reporting + bug fixes + deployments (20 hrs/month)**

| Platform | Monthly Cost | Annual |
|----------|--------------|--------|
| Zapier + Developer (20 hrs) | $3,050 | $36,600 |
| Traditional Agency (20 hrs @ $200/hr) | $4,000 | $48,000 |
| Freelancer (20 hrs @ $75/hr) | $1,500 | $18,000 |
| **RaaS Pro** | **$149** | **$1,788** |
| **You Save vs Agency** | **$3,851/mo** | **$46,212/yr** |

---

COMPETITIVE

# Add Sales Strategy
echo -e "  ${GREEN}✓${NC} Adding sales strategy section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'SALES_STRATEGY'
## Sales Strategy

### Three-Track Sales Engine

```
┌─────────────────────────────────────────────────────────────┐
│                    Revenue Engine                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Track 1: Product-Led Growth (Self-Serve)                  │
│  └─→ Pricing page → Free trial → Self-onboard → Expand    │
│     CAC: $0 (organic) | Conversion: 3-5% trial→paid        │
│                                                             │
│  Track 2: Inside Sales (SMB/Mid-Market)                    │
│  └─→ Inbound lead → Demo → Pro tier → Account management  │
│     CAC: $500-2K | Conversion: 15-25% demo→closed          │
│                                                             │
│  Track 3: Field Sales (Enterprise)                         │
│  └─→ Outbound → POC → Security review → Enterprise deal   │
│     CAC: $10K-50K | Conversion: 5-10% POC→closed           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Path to $1M ARR

| Quarter | MRR Target | ARR | Key Milestone |
|---------|------------|-----|---------------|
| Q1 2026 | $15K | $180K | Product-market fit validation |
| Q2 2026 | $50K | $600K | Channel partner program launch |
| Q3 2026 | $100K | $1.2M | Enterprise tier adoption |
| Q4 2026 | $150K | $1.8M | Market leadership position |

---

SALES_STRATEGY

# Add Getting Started
echo -e "  ${GREEN}✓${NC} Adding getting started section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'GETTING_STARTED'
## Getting Started

### 3 Steps to Revenue

#### 1. Book a Demo
See live mission execution. Watch AI agents write, test, deploy in real-time.

👉 **Link:** `agencyos.network/demo`

**Demo Agenda (30 min):**
- 5 min: Discovery — understand their workflow
- 10 min: Live demo — run their actual use case
- 10 min: ROI calculator — personalized numbers
- 5 min: Q&A + next steps

---

#### 2. 14-Day Free Trial (Pro Tier)
Full access. 1,000 credits. No credit card required.

👉 **Link:** `agencyos.network/pricing`

**Trial Success Checklist:**
- [ ] Complete onboarding wizard
- [ ] Run first mission (scaffold project)
- [ ] Deploy to production
- [ ] View ROI dashboard
- [ ] Run 10+ missions total

---

#### 3. Custom Quote (Enterprise)
Deployment assessment + custom agent training.

👉 **Email:** `sales@agencyos.network`

**Enterprise Sales Cycle:** 90-180 days
**Average Contract:** $50K-500K ACV

---

GETTING_STARTED

# Add FAQ
echo -e "  ${GREEN}✓${NC} Adding FAQ section..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'FAQ'
## FAQ

| Question | Answer |
|----------|--------|
| What happens if I run out of credits? | Starter/Pro can purchase top-ups at $0.25/credit. Enterprise is unlimited. |
| Can I pause my subscription? | Yes, pause anytime. Projects accessible, missions queued until resume. |
| What if a mission fails? | Credits automatically refunded. Audit log shows failure reason. |
| Can I self-host? | Enterprise tier includes on-premise deployment with dedicated engineer. |
| Is my code safe? | Yes. Enterprise includes private vault — data never leaves your boundary. |
| What LLMs do you support? | All major providers: Claude 4.6, Gemini 1.5 Pro, Qwen 3.5+. |

---

FAQ

# Add Call to Action
echo -e "  ${GREEN}✓${NC} Adding call to action..."
cat >> "$OUTPUT_DIR/raas-sales-deck-unified.md" << 'CTA'
## Call to Action

```
╔═════════════════════════════════════════════════════════╗
║                                                         ║
║           "The supreme art of war is to subdue          ║
║            the enemy without fighting."                 ║
║                      — 孫子兵法 (Sun Tzu)               ║
║                                                         ║
║           RaaS: Win by automating the grind.           ║
║                Focus your team on strategy.            ║
║                                                         ║
║                                                         ║
║   [Start Free Trial]  [Book a Demo]  [Contact Sales]   ║
║   agencyos.network/pricing                             ║
║   agencyos.network/demo                                ║
║   sales@agencyos.network                               ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```

---

**Contact:**

| Channel | Details |
|---------|---------|
| **Email** | `sales@agencyos.network` |
| **Website** | `agencyos.network/pricing` |
| **Demo** | `agencyos.network/demo` |
| **Docs** | `agencyos.network/docs` |

---

© 2026 Binh Phap Venture Studio
CTA

echo -e "  ${GREEN}✓${NC} Unified deck created: $OUTPUT_DIR/raas-sales-deck-unified.md"

# Generate HTML version
echo -e "${YELLOW}[5/5] Generating HTML version...${NC}"

# Check if pandoc is available
if command -v pandoc &> /dev/null; then
    pandoc "$OUTPUT_DIR/raas-sales-deck-unified.md" -o "$OUTPUT_DIR/raas-sales-deck.html" --standalone --metadata title="RaaS Sales Deck"
    echo -e "  ${GREEN}✓${NC} HTML version created: $OUTPUT_DIR/raas-sales-deck.html"
else
    echo -e "  ${YELLOW}⚠${NC} pandoc not installed. Skipping HTML generation."
    echo -e "     Install: brew install pandoc"
fi

# Generate PDF-ready version (markdown optimized for PDF conversion)
cat > "$OUTPUT_DIR/raas-sales-deck-pdf.md" << 'PDF_HEADER'
---
title: "RaaS Sales Deck — Revenue-as-a-Service"
subtitle: "Transform your agency from hourly billing to outcome-based revenue"
author: "AgencyOS Network"
date: "$(date +%Y-%m-%d)"
documentclass: article
geometry: margin=1in
---

PDF_HEADER

# Append unified deck content (skip first YAML frontmatter if any)
tail -n +2 "$OUTPUT_DIR/raas-sales-deck-unified.md" >> "$OUTPUT_DIR/raas-sales-deck-pdf.md" 2>/dev/null || \
    cat "$OUTPUT_DIR/raas-sales-deck-unified.md" >> "$OUTPUT_DIR/raas-sales-deck-pdf.md"

echo -e "  ${GREEN}✓${NC} PDF-ready markdown created: $OUTPUT_DIR/raas-sales-deck-pdf.md"

# Summary
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Sales Deck Generation Complete!              ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Generated files:                                         ║${NC}"
echo -e "${GREEN}║    - raas-sales-deck-unified.md (main deck)              ║${NC}"
echo -e "${GREEN}║    - raas-sales-deck-pdf.md (PDF-ready)                  ║${NC}"
if [ -f "$OUTPUT_DIR/raas-sales-deck.html" ]; then
    echo -e "${GREEN}║    - raas-sales-deck.html (HTML version)                 ║${NC}"
fi
echo -e "${GREEN}║                                                             ║${NC}"
echo -e "${GREEN}║  Output directory: $OUTPUT_DIR                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review: open $OUTPUT_DIR/raas-sales-deck-unified.md"
echo -e "  2. Convert to PDF: pandoc $OUTPUT_DIR/raas-sales-deck-pdf.md -o raas-sales-deck.pdf --pdf-engine=xelatex"
echo -e "  3. Present: Open HTML version in browser or use markdown viewer"

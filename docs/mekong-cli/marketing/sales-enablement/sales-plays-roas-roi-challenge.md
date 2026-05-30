# Sales Play: The ROI Challenge

> **Product-Led Growth Play for Inbound Trial Conversion**
> *Convert free trial users to paid customers by proving value in 14 days.*

**Play Type:** Product-Led Growth (PLG) | **Track:** Self-Serve | **Owner:** SDR/AE Team

---

## Play Overview

### Objective

Convert **20% of free trial users** to paid Pro tier ($149/mo) by demonstrating measurable ROI within the 14-day trial period.

### When to Use This Play

| Signal | Action |
|--------|--------|
| User signs up via pricing page | Trigger ROI Challenge sequence |
| Trial activation (first mission) | Begin Day 1-14 email sequence |
| High usage (>50% credits in 7 days) | SDR phone outreach |
| Low usage (<10% credits in 7 days) | Intervention sequence |
| Trial ending, no upgrade | Break-up sequence |

### Expected Metrics

| Metric | Target | Industry Benchmark |
|--------|--------|-------------------|
| Trial Signup → Activation | 50% | 40% |
| Activation → Paid | 20% | 15% |
| Paid → Expansion (Pro→Ent) | 10% | 8% |
| CAC | $0 (organic) | $500-2K (paid) |
| LTV:CAC | N/A (organic) | 3:1+ |

---

## Play Anatomy

### Phase 1: Trial Signup (Day 0)

**Trigger:** User completes signup at `agencyos.network/pricing`

**Automated Actions:**
1. Create account (Pro tier, 1,000 credits, 14-day trial)
2. Send welcome email (Email #1)
3. Add to HubSpot sequence: "ROI Challenge - Trial"
4. Notify SDR of new trial (Slack alert)

**SDR Action:** None (automated)

---

### Phase 2: Activation (Day 1-3)

**Goal:** User completes first mission successfully.

#### Email #1: Welcome + ROI Challenge (Day 0)

**Subject:** Welcome to RaaS + Your ROI Challenge

```
Hi [First Name],

Welcome to RaaS Pro! You now have:

✅ 1,000 credits (50-75 hours of dev work)
✅ 10 projects
✅ Full Pro features (ROI dashboard, API access)
✅ 14-day trial — no credit card required

## Your ROI Challenge

Most customers see 62x ROI. Here's how:

**Step 1:** Run your first mission (5 min)
→ Try: "Add user authentication with OAuth2"

**Step 2:** Complete 10+ missions in week 1
→ Automate: bug fixes, deployments, reports, refactors

**Step 3:** Check your ROI dashboard
→ See: hours saved, value delivered, success rate

**Expected ROI:**
- 62 hours saved × $150/hr = $9,300 value
- $9,300 - $149 subscription = $9,151 net value
- That's 62x your investment.

## Need Help Getting Started?

- Quick start guide: agencyos.network/docs/quickstart
- Mission ideas: agencyos.network/docs/mission-examples
- Book onboarding call: [Calendly Link]

Let me know if you have questions.

Best,
[Your Name]
Customer Success, AgencyOS

P.S. — Customers who complete 10+ missions in week 1 are 5x more likely to upgrade. Start now → agencyos.network/dashboard
```

---

#### Email #2: First Mission Suggestion (Day 1)

**Subject:** Here's your first mission suggestion

```
Hi [First Name],

Ready to run your first mission?

**Suggested Mission:** "Set up CI/CD pipeline with automated testing"

**Why this mission?**
- Saves 4-6 hours of manual work
- Runs autonomously in 5-10 minutes
- Sets up ongoing automation (saves time every deploy)

**How to run it:**
1. Go to dashboard → New Mission
2. Paste: "Set up GitHub Actions CI/CD with Jest testing, auto-deploy to Vercel on main branch push"
3. Click "Execute" → Watch AI agents plan, code, test, deploy

**Credits Used:** ~5-10 credits (Standard complexity)
**Time Saved:** 4-6 hours
**Value:** $600-900 (at $150/hr agency rate)

Run it now → agencyos.network/dashboard

Questions? Hit reply.

Best,
[Your Name]
```

---

#### Email #3: Social Proof (Day 3)

**Subject:** Customers like you automating X — try it

```
Hi [First Name],

Quick story:

**[Similar Agency]** — [Description, e.g., "30-person digital agency in NYC"]

**Challenge:** Backlog exceeding team capacity, turning down projects.

**What they automated in week 1:**
- Client reporting (4 hrs/week → 0)
- Bug fixes (8 hrs/week → 2)
- Deployments (3 hrs/week → 0)
- Code reviews (6 hrs/week → 1)

**Results (14 days):**
- 47 missions completed
- 38 hours saved → $5,700 value
- Upgraded to Pro → now billing outcomes, not hours

**Your trial stats so far:**
- Missions completed: [X]
- Credits used: [X] / 1,000
- Est. hours saved: [X] hrs

**Next milestone:** 10 missions in week 1 → unlocks full ROI.

Keep going → agencyos.network/dashboard

Best,
[Your Name]
```

---

### Phase 3: Engagement (Day 7)

**Goal:** Ensure user is engaged and seeing value.

#### Email #4: Check-In Call (Day 7)

**Subject:** How's the trial going? Need help?

```
Hi [First Name],

Checking in on your RaaS trial at the halfway point.

**Your stats:**
- Missions completed: [X]
- Credits used: [X] / 1,000
- Est. hours saved: [X] hrs
- Est. value: $[X]

**Quick questions:**
1. Running into any blockers?
2. Need help with mission setup?
3. Want me to suggest missions for your use case?

**Common wins at Day 7:**
- ✅ 10+ missions completed
- ✅ First production deploy
- ✅ ROI dashboard showing value

**Not there yet?** No worries. I can help:
- 15-min troubleshooting call: [Calendly Link]
- Custom mission ideas: [Link to examples]
- White-glove onboarding: Reply to this email

You have 7 days left. Let's make them count.

Best,
[Your Name]
SDR, AgencyOS

P.S. — Customers who hit 10 missions by Day 7 have 85% upgrade rate. You're at [X] — want help getting there?
```

---

#### Phone Call Script (Day 7 — High Usage)

**Trigger:** User has >50% credits used

**Script:**
```
SDR: "Hi [First Name], it's [Your Name] from AgencyOS. How's it going?

[Listen]

SDR: "Awesome! I'm calling because I noticed you've been crushing it on RaaS — [X] missions completed, [X]% credits used. That's impressive.

[Listen]

SDR: "The reason I'm reaching out: customers with your usage pattern typically see [X]x ROI in the first month. I want to make sure you're set up for success.

**Quick questions:**
1. What's been the biggest win so far?
2. Any blockers I can help remove?
3. Have you checked your ROI dashboard yet?

[Listen and respond]

SDR: "Perfect. Based on your usage, Pro tier at $149/mo would give you [specific benefit]. And with your volume, you'd see approximately $[X]/month in value.

**Here's what I recommend:**
- Keep running missions through Day 14
- I'll send you a custom ROI report at Day 13
- We hop on a 15-min call to review and discuss upgrade

Does that work?

[If yes] → Great, I'll follow up via email.
[If hesitant] → What's holding you back? [Handle objection]

Thanks for your time, [First Name]. Talk soon!"
```

---

### Phase 4: ROI Proof (Day 10-13)

**Goal:** Prove measurable value before trial ends.

#### Email #5: Your Trial ROI So Far (Day 10)

**Subject:** Your trial ROI so far: $[X]

```
Hi [First Name],

Quick update on your trial:

## Your RaaS ROI (Day 1-10)

✅ Missions completed: [X]
✅ Credits used: [X] / 1,000
✅ Est. hours saved: [X] hrs
✅ Est. value: $[X]
✅ Success rate: [X]%

## Trial Timeline

- **Day 10:** Today — you're at $[X] value
- **Day 14:** Trial ends
- **Upgrade by Day 14:** Keep all missions, history, ROI data
- **Don't upgrade:** Projects archived, missions paused

## Upgrade Options

**Pro ($149/mo)** — Best fit for your usage
- 1,000 credits/month (you used [X])
- ROI dashboard (you've earned $[X])
- API access (you've used [X] API calls)
- Priority support

**Enterprise ($499/mo)** — If you need:
- Unlimited credits
- SLA + dedicated engineer
- Custom agents trained on your codebase

Upgrade now → agencyos.network/pricing

**Questions?** Hit reply or book a call: [Calendly Link]

Best,
[Your Name]
```

---

#### Email #6: Trial Ending Soon (Day 13)

**Subject:** Trial ends tomorrow — let's review your ROI

```
Hi [First Name],

Your RaaS Pro trial ends in 24 hours.

**Final ROI Summary:**
- Missions completed: [X]
- Credits used: [X] / 1,000
- Hours saved: [X] hrs
- **Value delivered: $[X]**
- Success rate: [X]%

**Upgrade Benefits:**
✅ Keep all mission history
✅ Continue automation (no interruption)
✅ ROI dashboard stays active
✅ API access continues

**Pricing:**
- Pro: $149/mo (1,000 credits) ← Recommended for your usage
- Enterprise: $499/mo (unlimited, SLA, custom agents)

**Upgrade now:** agencyos.network/pricing

**Want to talk first?**
- 15-min ROI review: [Calendly Link]
- Reply to this email
- Call/text: [Your Phone]

No pressure — but you've earned $[X] of value. Seems like a no-brainer to keep it going.

Best,
[Your Name]
```

---

### Phase 5: Close (Day 14)

**Goal:** Convert before trial expires.

#### Email #7: Last Chance (Day 14, Morning)

**Subject:** Last chance — trial expires tonight

```
Hi [First Name],

Final reminder: Your RaaS Pro trial expires tonight at 11:59 PM PT.

**Your Investment:**
- 14 days of value: $[X] earned
- Upgrade cost: $149/mo
- Net gain: $[X] - $149 = **$[X] in your pocket**

**What Happens at Midnight:**
- Projects: Archived (read-only)
- Missions: Paused
- ROI data: Preserved for 30 days
- Account: Accessible, can't run new missions

**To Keep Going:**
Upgrade here → agencyos.network/pricing

Takes 2 minutes. No credit card verification needed (already on file from signup).

Questions? Call me directly: [Your Phone]

Best,
[Your Name]
```

---

#### Email #8: Extended Offer (Day 15 — Post-Expiry)

**Subject:** Trial expired — grace period extended

```
Hi [First Name],

Your trial expired last night, but I've extended you a 48-hour grace period.

**Why?** Because you've already earned $[X] of value with RaaS. Seems unfair to cut that off.

**Here's the deal:**
- Upgrade within 48 hours → Keep everything
- Upgrade within 48 hours → Get first month at 50% off ($74.50)
- After 48 hours → Account archived, need to restart

**Upgrade link:** agencyos.network/pricing

**Discount applied automatically** at checkout (code: ROI-CHALLENGE)

Still interested?

Best,
[Your Name]
```

---

## Objection Handling

### Common Objections & Responses

| Objection | Response |
|-----------|----------|
| "Too expensive" | "Let me show you the ROI calculator — Pro pays for itself in 2 days. You've already earned $[X] in 14 days." |
| "Need to think about it" | "Totally get it. What specifically do you need to think through? Budget? Use case? Timing? Let me help." |
| "Not enough time to use it" | "That's exactly why you need it — RaaS gives you time back. You saved [X] hrs in 14 days. Imagine 6 months." |
| "We'll build this in-house" | "Makes sense. What's the opportunity cost? 6 months dev time ($180K+) vs $149/mo? Plus we've spent 2 years perfecting this." |
| "Need my team's buy-in" | "Understood. Want me to join your next team meeting? I can demo and answer technical questions. Here's my calendar: [Link]" |
| "We're pivoting/changing priorities" | "No worries. RaaS adapts to your new direction. What's the new focus? I'll suggest relevant missions." |

---

## SDR Playbook

### Daily Trial Monitoring

**Dashboard View:** HubSpot "Active Trials" + RaaS Analytics

**Morning Checklist (9 AM PT):**
- [ ] Review new trial signups (Day 0)
- [ ] Check Day 7 users → call high usage
- [ ] Check Day 13 users → send ROI summary
- [ ] Check Day 14 expiries → send last chance
- [ ] Review stalled trials (<10% credits at Day 7) → intervention

**Trial Segmentation:**

| Segment | Criteria | Action |
|---------|----------|--------|
| **Hot** | >50% credits, >10 missions, Day 7-10 | Phone call + ROI review |
| **Warm** | 20-50% credits, 5-10 missions, Day 7-10 | Email sequence |
| **Cold** | <20% credits, <5 missions, Day 7 | Intervention email |
| **Dying** | <10% credits, Day 10-12 | Hail Mary call |
| **Closing** | Day 13-14, any usage | Upgrade sequence |

---

### Intervention Sequence (Low Usage)

**Trigger:** <10% credits used at Day 7

#### Email: Getting Stuck?

**Subject:** Getting stuck? Let me help

```
Hi [First Name],

Noticed you haven't had a chance to dive deep into RaaS yet. Totally get it — life gets busy.

**Common blockers I can help with:**
- Not sure what missions to run? → I'll send a custom list
- First mission failed? → I'll troubleshoot
- Need team alignment? → I'll join your call
- Just forgot? → No worries, trial extended

**Quick win suggestion:**
Run this mission (saves 2-3 hours):
"Generate weekly status report from Jira tickets and GitHub commits"

Credits: ~3 | Time saved: 2-3 hrs | Value: $300-450

Want a 10-min walkthrough? [Calendly Link]

Best,
[Your Name]
```

---

### Hail Mary Call (Day 12-13, Low Usage)

**Script:**
```
SDR: "Hi [First Name], it's [Your Name] from AgencyOS. Got a minute?

[Listen]

SDR: "I'll be quick. Noticed your trial is ending in 2 days, and I don't think you've gotten the full value yet.

**Honest question:** What's been the blocker?
- Time?
- Use case confusion?
- Technical issue?
- Just not the right fit?

[Listen carefully — this is gold]

**If fixable:** "I can solve that today. Let me [specific action]. Then you'll have 48 hours to see real value."

**If not fixable:** "Totally understand. Can I ask — what would've made this a home run for you? [Product feedback]"

**Close:** "If I [solve blocker], would you be willing to run 3-5 missions and reassess?

[If yes] → Great, I'll [action] and follow up tomorrow.
[If no] → "No hard feelings. Want me to extend your trial 7 more days? No pressure."
```

---

## Success Metrics

### KPI Dashboard

| Metric | Target | Actual | Variance |
|--------|--------|--------|----------|
| Trial Signups (monthly) | 500 | | |
| Activation Rate (Day 1) | 50% | | |
| Week 1 Engagement (10+ missions) | 40% | | |
| Trial→Paid Conversion | 20% | | |
| Paid→Expansion (Pro→Ent) | 10% | | |
| Churn (Month 1) | <5% | | |
| Net Revenue Retention | 120% | | |

### Weekly Reporting Template

```
## ROI Challenge — Week of [Date]

### Funnel Summary
- Trial Signups: [X]
- Activated (Day 1): [X] ([X]%)
- Week 1 Engaged (10+ missions): [X] ([X]%)
- Upgraded: [X] ([X]% conversion)
- Expansion (Pro→Ent): [X] ([X]%)

### Top Wins
- [Customer A]: Upgraded to Enterprise, $6K ACV
- [Customer B]: 62x ROI, case study candidate
- [Customer C]: Partner channel opportunity

### Blockers/Losses
- [Customer D]: Pricing objection → lost to competitor
- [Customer E]: Never activated → onboarding issue?

### Experiments This Week
- A/B test: Email #3 subject line
- New trigger: Day 5 check-in for high usage
- SDR script update: Focus on ROI, not features

### Next Week Focus
- Follow up on [X] hot trials
- Launch [experiment]
- Review [blocker] with product team
```

---

## Appendix A: Email Template Library

### Subject Line A/B Tests

| Template A | Template B | Winner |
|------------|------------|--------|
| "Welcome to RaaS + Your ROI Challenge" | "You just signed up for 62x ROI" | TBD |
| "Here's your first mission suggestion" | "Run this mission (saves 4-6 hrs)" | TBD |
| "Customers like you automating X" | "[Similar Company] saved $5,700 in week 1" | TBD |
| "How's the trial going?" | "Your ROI so far: $[X]" | TBD |
| "Trial ends tomorrow" | "You've earned $[X] — keep it" | TBD |

### Personalization Tokens

| Token | Source | Example |
|-------|--------|---------|
| `[First Name]` | HubSpot | "Sarah" |
| `[Company Name]` | HubSpot | "Acme Agency" |
| `[Similar Company]` | Playbook logic | "Pixel Labs (30-person agency)" |
| `[X] missions` | RaaS analytics | "47" |
| `$[X]` value | ROI calculator | "$5,700" |
| `[Use Case]` | Signup form | "CI/CD automation" |
| `[Your Name]` | SDR | "Alex" |

---

## Appendix B: ROI Calculator

### Formula

```
Monthly ROI = (Hours Saved × Agency Rate) - Subscription Cost

Example (Pro Tier):
- Hours Saved: 62 hrs (from 1,000 credits)
- Agency Rate: $150/hr (market average)
- Subscription: $149/mo

ROI = (62 × $150) - $149
    = $9,300 - $149
    = $9,151 net value/month
    = 62x ROI
```

### Hours per Credit

| Complexity | Credits | Hours Equivalent |
|------------|---------|------------------|
| Simple (1 credit) | 1 | 0.05 hrs (3 min) |
| Standard (3 credits) | 3 | 0.15 hrs (9 min) |
| Complex (5 credits) | 5 | 0.25 hrs (15 min) |
| Multi-Agent (10 credits) | 10 | 0.5 hrs (30 min) |

**Average:** 1 credit ≈ 0.062 hrs (3.7 min)

**Pro Tier (1,000 credits):** ≈ 62 hours

---

## Appendix C: Mission Ideas by Use Case

### For Agencies

| Mission | Credits | Time Saved | Value |
|---------|---------|------------|-------|
| Weekly client report automation | 5 | 4 hrs/wk | $600 |
| Bug triage + assignment | 3 | 2 hrs/wk | $300 |
| CI/CD pipeline setup | 10 | 6 hrs (one-time) | $900 |
| Code review automation | 5 | 3 hrs/wk | $450 |
| Deployment checklist automation | 3 | 1 hrs/deploy | $150 |

### For SaaS Startups

| Mission | Credits | Time Saved | Value |
|---------|---------|------------|-------|
| API endpoint scaffolding | 5 | 4 hrs/endpoint | $600 |
| Database migration scripts | 10 | 8 hrs (one-time) | $1,200 |
| Automated testing suite | 15 | 12 hrs (one-time) | $1,800 |
| Security audit + fixes | 10 | 6 hrs/wk | $900 |
| Tech debt cleanup sprint | 20 | 16 hrs (one-time) | $2,400 |

### For Enterprise

| Mission | Credits | Time Saved | Value |
|---------|---------|------------|-------|
| Compliance report generation | 10 | 8 hrs/mo | $1,200 |
| Legacy code refactoring | 50 | 40 hrs (one-time) | $6,000 |
| Multi-repo dependency sync | 20 | 16 hrs (one-time) | $2,400 |
| Security patch automation | 15 | 10 hrs/mo | $1,500 |
| DevOps pipeline standardization | 30 | 24 hrs (one-time) | $3,600 |

---

## Appendix D: Competitive Displacement

### When They're Using [Competitor]

| Competitor | Displacement Angle | Script |
|------------|-------------------|--------|
| **Zapier** | "Can't write code" | "Zapier connects apps. RaaS writes, tests, deploys code. What's your dev team doing that Zapier can't?" |
| **GitHub Copilot** | "Code completion only" | "Copilot suggests code. RaaS executes full missions — plans, codes, tests, deploys autonomously. What's the delta?" |
| **Traditional Agency** | "Hourly billing" | "Your agency bills $200/hr. RaaS is $149/mo for 62 hours equivalent. That's $3,851/mo savings." |
| **Freelancers** | "Unreliable, unavailable" | "Freelancers are great until they quit. RaaS is your 24/7 team. No hiring, no management, no downtime." |
| **In-House Team** | "Expensive, slow to hire" | "One engineer = $15K/mo. RaaS = $149/mo. Use your team for strategy, RaaS for execution." |

---

## Appendix E: Case Studies

### Case Study 1: Digital Agency (30 person)

**Profile:**
- Name: Pixel Labs
- Location: NYC
- Specialty: E-commerce development
- Challenge: Turning down projects due to capacity

**What They Automated:**
- Client reporting (4 hrs/wk → 0)
- Bug fixes (8 hrs/wk → 2)
- Deployments (3 hrs/wk → 0)
- Code reviews (6 hrs/wk → 1)

**Results (14-day trial):**
- 47 missions completed
- 38 hours saved
- $5,700 value delivered
- Upgraded to Pro → Enterprise at month 3

**Quote:** "RaaS let us say yes to 3 new projects without hiring. Revenue up 40%, team stress down 60%."

---

### Case Study 2: SaaS Startup (Series A)

**Profile:**
- Name: DataFlow
- Location: San Francisco
- Funding: $12M Series A
- Challenge: Backlog exceeding team capacity

**What They Automated:**
- API endpoint scaffolding (4 hrs/endpoint → 30 min)
- Automated testing (12 hrs → 2 hrs)
- Security audits (6 hrs/wk → 1 hr)
- Tech debt cleanup (ongoing → automated sprints)

**Results (14-day trial):**
- 67 missions completed
- 52 hours saved
- $7,800 value delivered
- Upgraded to Enterprise ($499/mo)

**Quote:** "We shipped 3 weeks of backlog in 5 days. CTO approved Enterprise tier same week."

---

### Case Study 3: Enterprise Innovation Team

**Profile:**
- Name: Fortune 500 Retailer
- Location: Chicago
- Initiative: Digital transformation
- Challenge: Legacy tech debt, compliance requirements

**What They Automated:**
- Compliance report generation (8 hrs/mo → 0)
- Legacy code refactoring (40 hrs → 0)
- Security patch automation (10 hrs/mo → 0)
- Batch data pipeline (24 hrs → 0)

**Results (30-day POC):**
- 214 missions completed
- 187 hours saved
- $28,050 value delivered
- Signed $120K annual contract

**Quote:** "POC paid for itself 10x. Enterprise tier with SLA was a no-brainer."

---

## Appendix F: HubSpot Sequence Setup

### Sequence Configuration

**Sequence Name:** ROI Challenge - Trial Conversion

**Enrollment Trigger:**
- Deal Stage: "Trial Started"
- Property: `trial_start_date` = [Today]

**Steps:**
1. Day 0: Email #1 (Welcome + ROI Challenge)
2. Day 1: Email #2 (First Mission Suggestion)
3. Day 3: Email #3 (Social Proof)
4. Day 7: Email #4 (Check-In) + Task: Call if >50% usage
5. Day 10: Email #5 (ROI Summary)
6. Day 13: Email #6 (Trial Ending Soon)
7. Day 14: Email #7 (Last Chance)
8. Day 15: Email #8 (Grace Period) ← If not upgraded

**Unenrollment Trigger:**
- Deal Stage: "Closed Won" (Upgraded)
- Deal Stage: "Closed Lost" (Not upgrading)

---

## Appendix G: Slack Alert Templates

### New Trial Signup

```
🚀 NEW TRIAL SIGNUP

Company: [Company Name]
Contact: [First Name] ([Email])
Plan: Pro (14-day trial)
Use Case: [Use case from signup form]
SDR Assigned: [SDR Name]

Dashboard → agencyos.network/admin/trials/[ID]
```

### High Usage Alert (Day 7, >50%)

```
🔥 HIGH USAGE TRIAL — CALL NOW

Company: [Company Name]
Contact: [First Name] ([Phone])
Usage: [X]% credits, [X] missions (Day 7)
Est. Value: $[X]
SDR Assigned: [SDR Name]

Action: Call within 24 hrs → ROI review + upgrade pitch
```

### Trial Expiring (Day 14, Not Upgraded)

```
⏰ TRIAL EXPIRING TONIGHT

Company: [Company Name]
Contact: [First Name] ([Email])
Usage: [X]% credits, [X] missions
Est. Value: $[X]
Upgrade Link: agencyos.network/pricing

Action: Send last chance email + offer call
```

---

> **"Value proven = deal closed. Value hidden = deal lost."**

**This play works because it forces value visibility. Every email, every call, every touchpoint shows the user exactly what they've earned. By Day 14, the math is undeniable.**

---

© 2026 Binh Phap Venture Studio

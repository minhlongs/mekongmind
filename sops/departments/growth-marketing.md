# Department SOP: Growth Marketing
Owner: business-analyst agent
Department: growth-marketing
GateArtifact: repeatable-channel
ArtifactPath: state/evidence/repeatable-channel.json
Metric: qualified pipeline and measurable channel learning

## Purpose

Turn the live offer into repeatable demand through positioning, content, outbound, SEO, partnerships, ads, and experiments.

## Trigger

Run after product is live or when pipeline is empty, CAC is unknown, or channel learning is stale.

## Agentic Room Contract

- RoomType: qualified demand generation room.
- WIP: 2 active channels, 3 campaign assets, 1 experiment learning loop.
- Intake: requires live MVP, offer brief, ICP, pricing, customer proof or CEO-approved launch exception.
- DecisionLoop: position promise -> build CTA assets -> timebox campaign -> collect leads/conversion -> update next experiment.
- Escalation: if traffic does not qualify or objections repeat, return learning to Product Strategy and Market Intelligence.
- AntiChaos: no vanity traffic; no unbounded campaign; no content without CTA and qualification.

## Command Admission

Marketing commands enter this room only when MVP/live or CEO launch exception evidence exists. Campaigns must produce qualified demand, not generic activity.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| positioning | marketing, content | Audience, positioning, CTA, and promise match offer evidence |
| content-engine | content, docs | Content assets tie pain, outcome, proof, and CTA together |
| campaign | launch, marketing | Campaign, channel, audience, campaign asset, email/outreach sequence, CTA, spend/timebox, opt-out/compliance, and expected conversion are recorded |
| launch | launch | Launch result includes outreach log, leads, replies, conversion, objections, and next experiment |
| growth-experiment | growth, experiment | Experiment learning improves channel, CTA, price, or ICP |

## SOP Steps

1. Select one primary channel and one backup channel based on ICP terrain.
2. Write positioning, core message, campaign asset, and call to action.
3. Launch a bounded experiment with target audience, campaign asset, email/outreach sequence, volume, cost, compliance/opt-out handling, and success threshold.
4. Capture send log, replies, demos, waitlist, signups, objections, and pipeline quality.
5. Write repeatable channel evidence and next experiment.

## Evidence Contract

`me solo run growth-marketing ready "channel signal captured"` must write `state/evidence/repeatable-channel.json`.

## Operating Checklist

- Turn offer into one positioning angle, one audience, one channel, one measurable experiment.
- Define lead qualification threshold before campaign execution.
- Capture creative, copy, email/outreach sequence, channel, spend/time, send log, replies, conversion, and learning.
- Do not pass if output is only content without pipeline signal.

## Required Evidence Fields

- `audience`, `positioning`, `channel`, `campaign`, `campaign_asset`, `email_sequence`, `outreach_log`, `cta`, `qualification_rule`, `opt_out_compliance`, `leads`, `conversion`, `learning`, `sales_handoff`.

## Automation Hooks

- `me solo route marketing` and `me solo route launch` confirm growth ownership.
- `me solo artifact write repeatable-channel business-analyst ready "<note>"` writes channel evidence.
- `me solo loop --once` should route next to Sales & Revenue when channel evidence exists.

## Escalation Rules

- Escalate to Product Strategy if message does not match offer; escalate to Market Intelligence if audience response contradicts ICP.

## Handoff

Next department is Sales & Revenue. Handoff must include qualified leads, source, message, outreach log, objection log, conversion metric, checkout CTA, opt-out/compliance note, and next campaign.

## Stop Conditions

- No channel selected.
- No measurable campaign.
- No real campaign asset or outreach/send log.
- Leads do not match ICP.
- No conversion metric captured.

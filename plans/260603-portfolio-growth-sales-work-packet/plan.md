# Portfolio Growth/Sales Work Packet

## Status
- In progress

## Context
- Goal requires every local product to move through MekongMind/Hermes self-selling loop.
- Current queue strict audit passes, but self-selling completion is 0/1159.
- Existing safe loop stops at CEO blueprint and offer; campaign/revenue proof must stay real.

## Scope
1. Add a product command that creates a per-product Growth Marketing + Sales Revenue execution packet.
2. Packet must include campaign/email/outreach, opt-out, Sales handoff, Polar checkout/provider evidence placeholders, and explicit guard that it is not proof.
3. Update registry/docs/tests so the command is discoverable and cannot be mistaken for revenue.

## Success Criteria
- Command writes product-specific packet under `state/products/evidence/<product>/`.
- Packet contains Growth and Sales required fields plus Polar canonical guard.
- Product queue records packet path and next department without marking self-selling.
- Tests pass for command, registry route, and strict queue audit.

## Risks
- Do not send outreach.
- Do not mutate Polar configuration.
- Do not mark revenue or self-selling from a draft packet.


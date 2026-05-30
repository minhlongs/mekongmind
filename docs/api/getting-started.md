# Getting Started with RaaS (Revenue-as-a-Service)

> **Complete guide**: From tenant signup to executing your first AI-powered mission.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Your Tenant](#step-1-create-your-tenant)
3. [Step 2: Save Your API Key](#step-2-save-your-api-key)
4. [Step 3: Verify Your Balance](#step-3-verify-your-balance)
5. [Step 4: Create Your First Mission](#step-4-create-your-first-mission)
6. [Step 5: Track Progress via SSE](#step-5-track-progress-via-sse)
7. [Step 6: Understand Credit Metering](#step-6-understand-credit-metering)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **API Endpoint**: `https://api.raas.mekong.network` (or your self-hosted URL)
- **cURL** or any HTTP client (Postman, Insomnia, etc.)
- **Node.js 18+** (optional, for TypeScript SDK)

---

## Step 1: Create Your Tenant

### Request

```bash
curl -X POST https://api.raas.mekong.network/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Cafe"
  }'
```

### Response (201 Created)

```json
{
  "tenant_id": "tenant_abc123",
  "name": "My Cafe",
  "api_key": "sk_live_7x8y9z0a1b2c3d4e5f6g",
  "tier": "free",
  "credits": 10,
  "message": "Save your API key — it cannot be recovered if lost!"
}
```

**Important:**
- You receive **10 free welcome credits** to start immediately
- Your API key is shown **only once** — save it securely
- Lost keys require regeneration (see [Regenerate API Key](#regenerate-api-key))

### Save Your API Key

```bash
# Add to your shell profile
echo 'export RAAS_API_KEY="sk_live_7x8y9z0a1b2c3d4e5f6g"' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 2: Verify Your Balance

### Request

```bash
curl -X GET https://api.raas.mekong.network/v1/credits \
  -H "Authorization: Bearer $RAAS_API_KEY"
```

### Response (200 OK)

```json
{
  "tenant_id": "tenant_abc123",
  "balance": 10,
  "tier": "free"
}
```

---

## Step 3: Create Your First Mission

Missions are AI-powered tasks that execute goals using the PEV (Plan-Execute-Verify) engine.

### Estimate Credits (Optional)

Before creating a mission, estimate the credit cost:

```bash
curl -X POST https://api.raas.mekong.network/v1/tasks/estimate \
  -H "Authorization: Bearer $RAAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Write a blog post about coffee brewing techniques"
  }'
```

**Response:**

```json
{
  "estimated_credits": 3,
  "complexity": "standard",
  "goal": "Write a blog post about coffee brewing techniques"
}
```

### Create the Mission

```bash
curl -X POST https://api.raas.mekong.network/v1/tasks \
  -H "Authorization: Bearer $RAAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Write a blog post about coffee brewing techniques"
  }'
```

**Response (201 Created):**

```json
{
  "id": "mission_xyz789",
  "tenant_id": "tenant_abc123",
  "goal": "Write a blog post about coffee brewing techniques",
  "status": "pending",
  "credits_used": 3,
  "created_at": "2026-03-19T10:30:00Z",
  "message": "Mission created. Use /v1/tasks/:id/stream to track progress."
}
```

**What just happened:**
1. **3 credits** were deducted from your balance
2. Mission entered `pending` queue
3. Agent will execute using Plan → Execute → Verify loop

---

## Step 4: Track Progress via SSE Stream

RaaS provides real-time progress updates via Server-Sent Events (SSE).

### Stream Mission Progress

```bash
curl -X GET https://api.raas.mekong.network/v1/tasks/mission_xyz789/stream \
  -H "Authorization: Bearer $RAAS_API_KEY"
```

### SSE Event Stream

```
event: status
data: {"id":"mission_xyz789","status":"planning","result":null}

event: status
data: {"id":"mission_xyz789","status":"executing","result":{"step":"generating_content"}}

event: status
data: {"id":"mission_xyz789","status":"verifying","result":{"checks_passed":3}}

event: status
data: {"id":"mission_xyz789","status":"completed","result":{"output":"blog_post.md","url":"https://storage.raas.mekong.network/outputs/mission_xyz789/blog_post.md"}}
```

### Parse SSE Events (JavaScript Example)

```javascript
const eventSource = new EventSource(
  'https://api.raas.mekong.network/v1/tasks/mission_xyz789/stream',
  {
    headers: { 'Authorization': `Bearer ${RAAS_API_KEY}` }
  }
);

eventSource.addEventListener('status', (event) => {
  const { status, result } = JSON.parse(event.data);
  console.log(`Mission ${status}:`, result);

  if (status === 'completed' || status === 'failed') {
    eventSource.close();
  }
});
```

### Poll for Status (Alternative to SSE)

If SSE is not available, poll the mission endpoint:

```bash
# Check mission status
curl -X GET https://api.raas.mekong.network/v1/tasks/mission_xyz789 \
  -H "Authorization: Bearer $RAAS_API_KEY"
```

**Response:**

```json
{
  "id": "mission_xyz789",
  "tenant_id": "tenant_abc123",
  "goal": "Write a blog post about coffee brewing techniques",
  "status": "completed",
  "result": {
    "output": "blog_post.md",
    "url": "https://storage.raas.mekong.network/outputs/mission_xyz789/blog_post.md"
  },
  "credits_used": 3,
  "created_at": "2026-03-19T10:30:00Z",
  "completed_at": "2026-03-19T10:32:15Z"
}
```

---

## Step 5: Understand Credit Metering

### Credit Costs by Complexity

| Complexity | Credits | Example Goals |
|------------|---------|---------------|
| Simple     | 1       | "Summarize this document", "Fix typo in file" |
| Standard   | 3       | "Write a blog post", "Analyze sales data" |
| Complex    | 5       | "Build a landing page", "Refactor authentication module" |

### Credit Estimation Formula

```javascript
// Internal estimation logic
function estimateCredits(goal: string): number {
  const wordCount = goal.split(' ').length;
  if (wordCount < 10) return 1;  // simple
  if (wordCount < 30) return 3;  // standard
  return 5;  // complex
}
```

### Refund Policy

Credits are refunded automatically in these scenarios:

1. **Mission Cancelled** (while pending):
   ```bash
   curl -X POST https://api.raas.mekong.network/v1/tasks/mission_xyz789/cancel \
     -H "Authorization: Bearer $RAAS_API_KEY"
   ```
   **Response:**
   ```json
   {
     "id": "mission_xyz789",
     "status": "cancelled",
     "refunded": 3
   }
   ```

2. **Mission Failed** (system error): Full refund automatically processed

3. **Mission Failed** (user error): No refund (e.g., invalid goal)

### View Credit History

```bash
curl -X GET https://api.raas.mekong.network/v1/credits/history?limit=10 \
  -H "Authorization: Bearer $RAAS_API_KEY"
```

**Response:**

```json
{
  "tenant_id": "tenant_abc123",
  "history": [
    {
      "id": "txn_001",
      "amount": -3,
      "balance_after": 7,
      "reason": "mission: Write a blog post about coffee brewing...",
      "created_at": "2026-03-19T10:30:00Z"
    },
    {
      "id": "txn_002",
      "amount": 10,
      "balance_after": 10,
      "reason": "welcome: free tier bonus",
      "created_at": "2026-03-19T10:00:00Z"
    }
  ],
  "limit": 10
}
```

---

## Step 6: Purchase More Credits

When your balance runs low, purchase additional credits via Polar.sh.

### View Pricing Tiers

```bash
curl -X GET https://api.raas.mekong.network/v1/pricing
```

**Response:**

```json
{
  "tiers": [
    { "id": "free", "name": "Free", "price": 0, "credits": 10, "description": "Try it out" },
    { "id": "agencyos-starter", "name": "Starter", "price": 29, "credits": 50, "description": "Solo non-tech user" },
    { "id": "agencyos-pro", "name": "Pro", "price": 99, "credits": 200, "description": "Small agency" },
    { "id": "agencyos-agency", "name": "Agency", "price": 199, "credits": 500, "description": "Growing agency" },
    { "id": "agencyos-master", "name": "Master", "price": 399, "credits": 1000, "description": "Premium agency" }
  ],
  "credit_packs": [
    { "id": "credits-10", "credits": 10, "price": 5 },
    { "id": "credits-50", "credits": 50, "price": 20 },
    { "id": "credits-100", "credits": 100, "price": 35 }
  ],
  "credit_costs": { "simple": 1, "standard": 3, "complex": 5 }
}
```

### Purchase Flow

1. **Visit Polar.sh checkout** (link from dashboard)
2. **Select tier or credit pack**
3. **Complete payment**
4. **Credits auto-added** via webhook (typically < 30 seconds)

**Webhook Payload (internal):**

```json
{
  "type": "order.paid",
  "data": {
    "tenant_id": "tenant_abc123",
    "product_name": "agencyos-starter",
    "credits": 50
  }
}
```

---

## API Reference

### Authentication

All authenticated endpoints require Bearer token:

```
Authorization: Bearer sk_live_7x8y9z0a1b2c3d4e5f6g
```

### Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/tenants` | Create tenant | No |
| POST | `/v1/tenants/regenerate-key` | Regenerate API key | No |
| GET | `/v1/credits` | Get balance | Yes |
| GET | `/v1/credits/history` | Transaction history | Yes |
| GET | `/v1/pricing` | Pricing tiers | No |
| POST | `/v1/tasks` | Create mission | Yes |
| GET | `/v1/tasks/:id` | Get mission status | Yes |
| GET | `/v1/tasks/:id/stream` | SSE progress stream | Yes |
| POST | `/v1/tasks/:id/cancel` | Cancel pending mission | Yes |
| POST | `/v1/tasks/estimate` | Estimate credits | Yes |

### Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 402 | `INSUFFICIENT_CREDITS` | Not enough credits |
| 404 | `NOT_FOUND` | Mission not found |
| 409 | `CONFLICT` | Cannot cancel (already executing) |
| 503 | `SERVICE_UNAVAILABLE` | Database not configured |

**Error Format:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Goal is required",
  "details": [...]
}
```

---

## Troubleshooting

### "Insufficient credits" (402)

**Solution:** Purchase more credits or use a simpler goal (lower credit cost).

```bash
# Check current balance
curl -X GET https://api.raas.mekong.network/v1/credits \
  -H "Authorization: Bearer $RAAS_API_KEY"
```

### "Invalid API key" (401)

**Solution:** Verify your API key is correct and not expired.

```bash
# Test with explicit key
curl -X GET https://api.raas.mekong.network/v1/credits \
  -H "Authorization: Bearer sk_live_7x8y9z0a1b2c3d4e5f6g"
```

### "Mission not found" (404)

**Solution:** Verify mission ID and tenant ownership.

### SSE stream disconnects

**Solution:** Fall back to polling:

```bash
# Poll every 5 seconds
while true; do
  curl -s https://api.raas.mekong.network/v1/tasks/mission_xyz789 \
    -H "Authorization: Bearer $RAAS_API_KEY" | jq '.status'
  sleep 5
done
```

### Webhook not adding credits

**Solution:** Check webhook logs and verify tenant_id in metadata.

---

## Next Steps

- [Onboarding Guide](./onboarding.md) — Complete 4-step onboarding (profile → channel → menu → activate)
- [Agents API](./agents-api.md) — Use GitAgent, FileAgent, ShellAgent for specific tasks
- [Governance](./governance.md) — Quadratic voting, proposals, and reputation system
- [SDK](./sdk.md) — TypeScript/Python SDKs for programmatic access

---

**Questions?** Join our Discord: https://discord.gg/agencyos

**Support:** support@agencyos.network

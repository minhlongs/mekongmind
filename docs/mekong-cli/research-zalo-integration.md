# Zalo OA Webhook Integration & LLM Lead Parsing on Cloudflare Workers

This report outlines the implementation of a Zalo OA webhook receiver, security verification, LLM lead parsing, and saving to D1 SQLite using a Cloudflare Workers + Hono (TypeScript) stack.

## 1. Zalo OA Webhooks & Authentication
Zalo OA authenticates clients via OAuth 2.0. For real-time updates, Zalo POSTs JSON events to the Webhook URL.
- **Event Type:** `user_send_text` payload:
```json
{
  "app_id": "YOUR_APP_ID",
  "sender": { "id": "SENDER_ZALO_ID" },
  "recipient": { "id": "OA_ID" },
  "event_name": "user_send_text",
  "message": { "text": "I want to buy a house in District 2 for under 5 billion. Call me at 0901234567.", "msg_id": "MSG_ID" },
  "timestamp": "1716301234"
}
```

## 2. Web Crypto Signature Verification
Zalo secures webhooks using the `X-ZEvent-Signature` header (HMAC-SHA256).
- **Formula:** `mac = HMAC-SHA256(appId + rawBody + timestamp + OAsecretKey)` using `OAsecretKey` as the secret key.

```typescript
import { Context } from 'hono';

export interface Env {
  DB: D1Database;
  ZALO_OA_SECRET_KEY: string;
  AI: {
    run: (model: string, inputs: Record<string, unknown>) => Promise<{ response: string }>;
  };
}

export async function verifySignature(c: Context<{ Bindings: Env }>, rawBody: string): Promise<boolean> {
  const signature = c.req.header('X-ZEvent-Signature') || '';
  const body = JSON.parse(rawBody) as { app_id?: string; timestamp?: string };
  const appId = body.app_id || '';
  const timestamp = body.timestamp || '';
  const secretKey = c.env.ZALO_OA_SECRET_KEY;

  if (!signature || !appId || !timestamp || !secretKey) return false;

  const dataToSign = `${appId}${rawBody}${timestamp}${secretKey}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSig === signature;
}
```

## 3. LLM Lead Parsing with JSON Mode
Using Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`), we parse incoming message text into structured lead variables.

```typescript
export interface Lead {
  name: string | null;
  phone: string | null;
  area: string | null;
  price: string | null;
  intent: 'warm' | 'cold' | 'junk' | null;
}

export async function parseLead(env: Env, text: string): Promise<Lead> {
  const prompt = `Extract lead details from message. Respond strictly in JSON:
{
  "name": string or null,
  "phone": string or null,
  "area": string or null,
  "price": string or null,
  "intent": "warm" | "cold" | "junk" or null
}
Message: "${text}"`;

  const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.response) as Lead;
}
```

## 4. D1 Database Integration
Below is the SQLite schema for D1 and the implementation inside the Hono route.

### Schema (`schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  zalo_user_id TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  interest_area TEXT,
  interest_price TEXT,
  intent TEXT,
  last_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Route Handler (`index.ts`)
```typescript
import { Hono } from 'hono';
import { verifySignature, parseLead, Env } from './utils';

const app = new Hono<{ Bindings: Env }>();

app.post('/webhook', async (c) => {
  const rawBody = await c.req.text();
  const isValid = await verifySignature(c, rawBody);
  if (!isValid) return c.text('Unauthorized', 401);

  const payload = JSON.parse(rawBody) as {
    event_name: string;
    sender: { id: string };
    message: { text: string };
  };

  if (payload.event_name === 'user_send_text') {
    const userId = payload.sender.id;
    const text = payload.message.text;

    const lead = await parseLead(c.env, text);

    await c.env.DB.prepare(`
      INSERT INTO leads (id, zalo_user_id, name, phone, interest_area, interest_price, intent, last_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(zalo_user_id) DO UPDATE SET
        name = COALESCE(excluded.name, name),
        phone = COALESCE(excluded.phone, phone),
        interest_area = COALESCE(excluded.interest_area, interest_area),
        interest_price = COALESCE(excluded.interest_price, interest_price),
        intent = COALESCE(excluded.intent, intent),
        last_message = excluded.last_message
    `).bind(crypto.randomUUID(), userId, lead.name, lead.phone, lead.area, lead.price, lead.intent, text).run();
  }

  return c.text('OK');
});

export default app;
```

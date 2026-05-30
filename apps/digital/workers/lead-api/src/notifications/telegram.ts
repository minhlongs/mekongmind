import type { Env, LeadInput } from '../types';

// NOTE: Emoji usage here (🚀) is intentional — this is an internal Telegram
// notification, NOT user-facing UI. The design-system no-emoji rule applies
// only to frontend components.

/**
 * Sends a lead notification to a Telegram chat.
 * Silent no-op when TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are unset.
 * Caller wraps in waitUntil for fire-and-forget.
 */
export async function sendTelegram(env: Env, lead: LeadInput): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return;
  }

  const lines = [
    '🚀 Lead mới — Mekong Digital',
    `Họ tên: ${lead.name}`,
    `SĐT: ${lead.phone}`,
    `Công ty: ${lead.company}`,
    `Ngành: ${lead.industry}`,
    `Ngân sách: ${lead.budget}`,
    `Variant: ${lead.variant ?? 'generic'}`,
    lead.pain ? `Vấn đề: ${lead.pain}` : '',
  ].filter(Boolean);

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      // parse_mode omitted — plain text is safe; HTML would require escaping lead fields
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Telegram error:', response.status, errText);
  }
}

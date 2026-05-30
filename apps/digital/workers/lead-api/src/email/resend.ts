import type { Env, LeadInput } from '../types';

/**
 * Sends a lead notification email via Resend HTTP API.
 * Uses fire-and-forget pattern (caller wraps in waitUntil).
 * Placeholder from/to — swap with verified domain before production.
 */
export async function sendEmail(env: Env, lead: LeadInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }
  if (!env.RESEND_FROM_ADDRESS || !env.LEAD_NOTIFICATION_TO) {
    console.warn('RESEND_FROM_ADDRESS or LEAD_NOTIFICATION_TO not set — skipping email');
    return;
  }

  const html = buildEmailHtml(lead);
  const recipients = env.LEAD_NOTIFICATION_TO.split(',').map((s) => s.trim()).filter(Boolean);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_ADDRESS,
      to: recipients,
      subject: `[Lead] ${lead.company} — ${lead.industry}`,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Resend error:', response.status, text);
  }
}

function buildEmailHtml(lead: LeadInput): string {
  return `
    <h2>Lead mới — Mekong Digital</h2>
    <table cellpadding="6" cellspacing="0" border="0">
      <tr><td><strong>Họ tên:</strong></td><td>${escapeHtml(lead.name)}</td></tr>
      <tr><td><strong>SĐT:</strong></td><td>${escapeHtml(lead.phone)}</td></tr>
      <tr><td><strong>Công ty:</strong></td><td>${escapeHtml(lead.company)}</td></tr>
      <tr><td><strong>Ngành:</strong></td><td>${escapeHtml(lead.industry)}</td></tr>
      <tr><td><strong>Ngân sách:</strong></td><td>${escapeHtml(lead.budget)}</td></tr>
      <tr><td><strong>Variant:</strong></td><td>${escapeHtml(lead.variant ?? 'generic')}</td></tr>
      ${lead.pain ? `<tr><td><strong>Vấn đề:</strong></td><td>${escapeHtml(lead.pain)}</td></tr>` : ''}
    </table>
  `;
}

/** XSS prevention — escape HTML special characters in user-supplied strings. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

import { Hono } from 'hono';
import type { Env, LeadInput } from '../types';
import { INDUSTRIES, BUDGET_BANDS, VARIANTS } from '../types';
import { sendEmail } from '../email/resend';
import { sendTelegram } from '../notifications/telegram';

export const lead = new Hono<{ Bindings: Env }>();

// Vietnamese phone: landline (028xxxxxxx) or mobile (0[3-9]xxxxxxxx / +84...)
const VN_PHONE_REGEX = /^(\+84|0)[0-9]{9,10}$/;

type ValidationResult =
  | { ok: true; data: Required<Pick<LeadInput, 'name' | 'phone' | 'company' | 'industry' | 'budget'>> & { pain: string | undefined; variant: string } }
  | { ok: false; error: string };

function validate(input: Partial<LeadInput>): ValidationResult {
  const name = input.name?.trim() ?? '';
  if (name.length < 2 || name.length > 100) {
    return { ok: false, error: 'Họ tên không hợp lệ (2–100 ký tự)' };
  }

  const phone = input.phone?.trim() ?? '';
  if (!VN_PHONE_REGEX.test(phone)) {
    return { ok: false, error: 'Số điện thoại không hợp lệ' };
  }

  const company = input.company?.trim() ?? '';
  if (company.length < 2 || company.length > 200) {
    return { ok: false, error: 'Tên công ty không hợp lệ (2–200 ký tự)' };
  }

  if (!input.industry || !(INDUSTRIES as readonly string[]).includes(input.industry)) {
    return { ok: false, error: 'Ngành không hợp lệ' };
  }

  if (!input.budget || !(BUDGET_BANDS as readonly string[]).includes(input.budget)) {
    return { ok: false, error: 'Ngân sách không hợp lệ' };
  }

  const pain = input.pain?.trim();
  if (pain !== undefined && pain.length > 500) {
    return { ok: false, error: 'Mô tả vấn đề quá dài (tối đa 500 ký tự)' };
  }

  // Fall back to 'generic' if variant missing or unrecognised
  const variant =
    input.variant && (VARIANTS as readonly string[]).includes(input.variant)
      ? input.variant
      : 'generic';

  return {
    ok: true,
    data: {
      name,
      phone,
      company,
      industry: input.industry,
      budget: input.budget,
      pain: pain === '' ? undefined : pain,
      variant,
    },
  };
}

lead.post('/', async (c) => {
  let body: Partial<LeadInput>;

  const contentType = c.req.header('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json<Partial<LeadInput>>();
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await c.req.formData();
      body = Object.fromEntries(formData.entries()) as Partial<LeadInput>;
    } else {
      return c.json({ error: 'Định dạng yêu cầu không được hỗ trợ' }, 415);
    }
  } catch {
    return c.json({ error: 'Dữ liệu gửi lên không hợp lệ' }, 400);
  }

  const result = validate(body);
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  const { data } = result;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Persist to D1
  try {
    await c.env.DB.prepare(
      `INSERT INTO leads (id, created_at, name, phone, company, industry, budget, pain, variant)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        createdAt,
        data.name,
        data.phone,
        data.company,
        data.industry,
        data.budget,
        data.pain ?? null,
        data.variant,
      )
      .run();
  } catch (err) {
    console.error('D1 insert error:', err);
    return c.json({ error: 'Lỗi lưu dữ liệu, vui lòng thử lại' }, 500);
  }

  // Fire-and-forget: email + Telegram (non-blocking)
  c.executionCtx.waitUntil(
    Promise.allSettled([sendEmail(c.env, data), sendTelegram(c.env, data)]),
  );

  // HTML form submissions → 303 redirect to /thank-you.
  // Prefer SITE_URL env (config-driven), fallback to referer (best-effort, can be stripped).
  const accept = c.req.header('accept') ?? '';
  if (accept.includes('text/html')) {
    const baseUrl = c.env.SITE_URL ?? c.req.header('referer');
    if (baseUrl) {
      try {
        const redirectUrl = new URL('/thank-you', baseUrl);
        return c.redirect(redirectUrl.toString(), 303);
      } catch {
        // Malformed URL — fall through to JSON
      }
    }
  }

  return c.json({ ok: true, id }, 201);
});

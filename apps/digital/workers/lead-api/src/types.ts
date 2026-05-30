export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  RESEND_FROM_ADDRESS: string;
  LEAD_NOTIFICATION_TO: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ALLOWED_ORIGIN: string;
  SITE_URL?: string;
  BUILD_SHA?: string;
}

export interface LeadInput {
  name: string;
  phone: string;
  company: string;
  industry: string;
  budget: string;
  pain?: string;
  variant?: string;
}

// Controlled vocabularies — sourced from docs/templates/pain-tag-schema.md
export const INDUSTRIES = [
  'food',
  'retail',
  'tourism',
  'services',
  'agri',
  'manufacture',
  'logistics',
  'construction',
  'health',
  'education',
  'other',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

// Budget bands per year (aligned with pain-tag-schema.md budget_band field)
export const BUDGET_BANDS = [
  'under-30tr',
  '30-100tr',
  '100-300tr',
  '300tr-plus',
  'undefined',
] as const;

export type BudgetBand = (typeof BUDGET_BANDS)[number];

// Landing page variants for segment tracking
export const VARIANTS = ['ocop', 'htx', 'tourism', 'generic'] as const;

export type Variant = (typeof VARIANTS)[number];

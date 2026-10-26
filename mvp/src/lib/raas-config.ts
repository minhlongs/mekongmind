export interface RaasTierConfig {
  id: 'basic' | 'premium' | 'enterprise' | 'master';
  name: string;
  priceUsd: number;
  priceVnd: number;
  mcuCredits: number;
  currency: 'USD';
  badge: string | null;
  description: string;
  features: string[];
}

export const COMMERCIAL_TIERS: Record<RaasTierConfig['id'], RaasTierConfig> = {
  basic: {
    id: 'basic',
    name: 'OPC Basic',
    priceUsd: 199,
    priceVnd: 4_975_000,
    mcuCredits: 1_500,
    currency: 'USD',
    badge: null,
    description: '1,500 MCU credits. Declarative Business Packs, SHA-256 Approval Gate & SQLite WAL local state.',
    features: [
      '1,500 MCU Credits / chu kỳ',
      'Pack: client-proposal-followup (opc-pack/v1)',
      'Payload-Bound SHA-256 Approval Token',
      'Honest Usage Ledger (Estimated / Actual / Unknown)',
      '100% Offline-Capable Core Runtime',
    ],
  },
  premium: {
    id: 'premium',
    name: 'OPC Premium',
    priceUsd: 399,
    priceVnd: 9_975_000,
    mcuCredits: 4_000,
    currency: 'USD',
    badge: 'POPULAR',
    description: '4,000 MCU credits. Multi-Currency (USD/VND/EUR), Country Packs & Dual-Rail RaaS sync.',
    features: [
      '4,000 MCU Credits / chu kỳ',
      'Multi-Currency (USD, VND, EUR) & IANA Timezones',
      'MEKONG-RAAS-v1 Cryptographic License Key',
      'Idempotent Connector Dispatch & Reconciliation',
      'Dual-Rail Checkout (VietQR Napas 247 + NOWPayments)',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'OPC Enterprise',
    priceUsd: 799,
    priceVnd: 19_975_000,
    mcuCredits: 10_000,
    currency: 'USD',
    badge: null,
    description: '10,000 MCU credits. Custom Country Packs, Audit Ledger & Multi-Workspace Isolation.',
    features: [
      '10,000 MCU Credits / chu kỳ',
      'Custom Business & Country Packs (opc-pack/v1)',
      'Design Intelligence 9-Axis Gate Suite',
      'Dedicated Cloud RaaS Control Plane',
      'Priority SLA 99.9%',
    ],
  },
  master: {
    id: 'master',
    name: 'OPC Master Sovereign',
    priceUsd: 4999,
    priceVnd: 124_975_000,
    mcuCredits: 100_000,
    currency: 'USD',
    badge: 'SOVEREIGN',
    description: '100,000 MCU credits. Full White-Label OPC Ecosystem, Custom Connectors & 24/7 Engineering.',
    features: [
      '100,000 MCU Credits / chu kỳ',
      'White-Label OPC Platform & Custom Connectors',
      '25/25 Open-Core Readiness Blueprint Verified',
      'Dedicated Sovereign Infrastructure',
      '1-on-1 Principal Architect Onboarding',
    ],
  },
};

export type TierId = keyof typeof COMMERCIAL_TIERS;
export const TIER_IDS = Object.keys(COMMERCIAL_TIERS) as TierId[];

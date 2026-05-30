/**
 * RaaS Pricing Plans Configuration
 *
 * Shared configuration cho pricing tiers across Landing Page và Dashboard
 * Đổi 1 chỗ, áp dụng toàn bộ system
 */

export type PlanTier = 'free' | 'starter' | 'growth' | 'premium' | 'enterprise'

export interface PricingPlan {
  tier: PlanTier
  label: string
  description: string
  priceMonthly: number
  priceYearly: number
  currency: string
  mcuLimit: number
  features: string[]
  highlight?: boolean
  accentClass: string
}

/**
 * Danh sách pricing tiers cho AgencyOS RaaS
 * Cập nhật ở đây để sync giữa Landing Page và Dashboard
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: 'free',
    label: 'Free',
    description: 'For developers exploring RaaS',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    mcuLimit: 10_000,
    features: [
      '10K MCU/month',
      '2 API keys',
      'Community support',
      'Basic analytics',
    ],
    accentClass: 'text-zinc-400',
  },
  {
    tier: 'starter',
    label: 'Starter',
    description: 'For solo developers',
    priceMonthly: 29,
    priceYearly: 290,
    currency: 'USD',
    mcuLimit: 100_000,
    features: [
      '100K MCU/month',
      '5 API keys',
      'Email support',
      'Advanced analytics',
      'Custom domains',
    ],
    accentClass: 'text-blue-400',
  },
  {
    tier: 'growth',
    label: 'Growth',
    description: 'For growing teams',
    priceMonthly: 79,
    priceYearly: 790,
    currency: 'USD',
    mcuLimit: 500_000,
    features: [
      '500K MCU/month',
      '15 API keys',
      'Priority support',
      'Team collaboration',
      'Webhook integrations',
      'SLA guarantee',
    ],
    highlight: true,
    accentClass: 'text-purple-400',
  },
  {
    tier: 'premium',
    label: 'Premium',
    description: 'For scaling businesses',
    priceMonthly: 199,
    priceYearly: 1990,
    currency: 'USD',
    mcuLimit: 2_000_000,
    features: [
      '2M MCU/month',
      '50 API keys',
      '24/7 phone support',
      'Custom integrations',
      'Dedicated account manager',
      '99.9% SLA',
      'Audit logs',
    ],
    accentClass: 'text-yellow-400',
  },
  {
    tier: 'enterprise',
    label: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: 0, // Custom pricing
    priceYearly: 0,
    currency: 'USD',
    mcuLimit: -1, // Unlimited
    features: [
      'Unlimited MCU',
      'Unlimited API keys',
      'Dedicated support team',
      'Custom contracts',
      'On-premise deployment',
      '99.99% SLA',
      'Custom training',
    ],
    accentClass: 'text-green-400',
  },
]

/**
 * Helper để tìm plan theo tier
 */
export function getPlanByTier(tier: PlanTier): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.tier === tier)
}

/**
 * Helper để format giá
 */
export function formatPrice(plan: PricingPlan, yearly: boolean = false): string {
  if (plan.priceMonthly === 0 && plan.priceYearly === 0) {
    return 'Custom'
  }

  const price = yearly ? plan.priceYearly : plan.priceMonthly
  const period = yearly ? '/ year' : '/ mo'

  return `$${price}${period}`
}

/**
 * Helper để tính MCU display
 */
export function formatMcuLimit(mcuLimit: number): string {
  if (mcuLimit === -1) {
    return 'Unlimited MCU'
  }
  if (mcuLimit >= 1_000_000) {
    return `${(mcuLimit / 1_000_000).toLocaleString()}M MCU / mo`
  }
  if (mcuLimit >= 1_000) {
    return `${(mcuLimit / 1_000).toLocaleString()}K MCU / mo`
  }
  return `${mcuLimit.toLocaleString()} MCU / mo`
}

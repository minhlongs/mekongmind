export const POLAR_PRODUCTS = {
  starter: {
    id: process.env.NEXT_PUBLIC_POLAR_PRODUCT_STARTER || 'starter',
    name: 'Mekong IDE Starter',
    price: 49,
    currency: 'USD',
    description: '200 credits/month. 22 operational modules, 385 workflow templates.',
  },
  growth: {
    id: process.env.NEXT_PUBLIC_POLAR_PRODUCT_GROWTH || 'growth',
    name: 'Mekong IDE Growth',
    price: 149,
    currency: 'USD',
    description: '1,000 credits/month. Priority execution.',
  },
  premium: {
    id: process.env.NEXT_PUBLIC_POLAR_PRODUCT_PREMIUM || 'premium',
    name: 'Mekong IDE Pro',
    price: 499,
    currency: 'USD',
    description: '5,000 credits/month. Dedicated support.',
  },
  master: {
    id: process.env.NEXT_PUBLIC_POLAR_PRODUCT_MASTER || 'master',
    name: 'Mekong IDE Master',
    price: 499,
    currency: 'USD',
    description: 'Unlimited everything. White-label. 24/7 priority support.',
  },
} as const;

export type ProductId = keyof typeof POLAR_PRODUCTS;
export const PRODUCT_IDS = Object.keys(POLAR_PRODUCTS) as ProductId[];

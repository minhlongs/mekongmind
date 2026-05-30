#!/usr/bin/env node
/**
 * create-polar-products.ts — Auto-create 12 Polar.sh products
 *
 * Usage:
 *   npx tsx scripts/create-polar-products.ts
 *
 * Requires: POLAR_API_KEY environment variable
 */

import { PolarClient } from '../packages/mekong-cli-core/src/payments/polar-client.js';

// Product configurations for 3 apps × 4 tiers
const PRODUCTS = [
  // raas-gateway products
  {
    name: 'RaaS Gateway - Starter',
    description: 'Starter tier for RaaS Gateway — 50 MCU/month',
    priceAmount: 2900, // $29 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'RaaS Gateway - Pro',
    description: 'Pro tier for RaaS Gateway — 200 MCU/month',
    priceAmount: 9900, // $99 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'RaaS Gateway - Agency',
    description: 'Agency tier for RaaS Gateway — 500 MCU/month',
    priceAmount: 19900, // $199 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'RaaS Gateway - Master',
    description: 'Master tier for RaaS Gateway — 1000 MCU/month',
    priceAmount: 39900, // $399 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  // well products
  {
    name: 'WellNexus - Starter',
    description: 'Starter tier for WellNexus — 50 MCU/month',
    priceAmount: 4900, // $49 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'WellNexus - Pro',
    description: 'Pro tier for WellNexus — 200 MCU/month',
    priceAmount: 19900, // $199 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'WellNexus - Agency',
    description: 'Agency tier for WellNexus — 500 MCU/month',
    priceAmount: 49900, // $499 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'WellNexus - Master',
    description: 'Master tier for WellNexus — 1000 MCU/month',
    priceAmount: 99900, // $999 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  // algo-trader products
  {
    name: 'Algo Trader - Starter',
    description: 'Starter tier for Algo Trader — 50 MCU/month',
    priceAmount: 4900, // $49 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'Algo Trader - Pro',
    description: 'Pro tier for Algo Trader — 200 MCU/month',
    priceAmount: 19900, // $199 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'Algo Trader - Agency',
    description: 'Agency tier for Algo Trader — 500 MCU/month',
    priceAmount: 49900, // $499 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
  {
    name: 'Algo Trader - Master',
    description: 'Master tier for Algo Trader — 1000 MCU/month',
    priceAmount: 99900, // $999 in cents
    priceCurrency: 'USD',
    recurringInterval: 'month' as const,
  },
];

async function main() {
  console.log('🚀 Creating Polar.sh products...\n');

  // Check API key
  const apiKey = process.env.POLAR_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: POLAR_API_KEY environment variable not set');
    console.error('');
    console.error('Set it via:');
    console.error('  export POLAR_API_KEY=sk_live_...');
    console.error('');
    console.error('Or get your API key from: https://polar.sh/dashboard/settings/api');
    process.exit(1);
  }

  // Create client
  const client = new PolarClient({ apiKey });
  console.log('✅ PolarClient initialized\n');

  // List existing products
  console.log('📋 Checking existing products...');
  const existingResult = await client.listProducts();
  if (!existingResult.ok) {
    console.error('❌ Error listing products:', existingResult.error.message);
    process.exit(1);
  }
  console.log(`   Found ${existingResult.value.length} existing products\n`);

  // Note: Polar API doesn't have a create product endpoint in the public API
  // Products must be created via dashboard
  console.log('⚠️  LIMITATION: Polar.sh API does not expose product creation endpoint.\n');
  console.log('📋 Manual Steps Required:\n');
  console.log('1. Go to https://polar.sh/dashboard\n');
  console.log('2. Click "Products" → "New Product"\n');
  console.log('3. Create each product with these settings:\n');

  for (const product of PRODUCTS) {
    const priceInDollars = (product.priceAmount / 100).toFixed(2);
    console.log(`   ┌─────────────────────────────────────────────`);
    console.log(`   │ Name:        ${product.name}`);
    console.log(`   │ Description: ${product.description}`);
    console.log(`   │ Price:       $${priceInDollars}/month`);
    console.log(`   │ MCU:         ${product.description.split('— ')[1]}`);
    console.log(`   └─────────────────────────────────────────────\n`);
  }

  console.log('💡 Tip: Use the Polar dashboard bulk import if available.\n');
  console.log('After creating products, copy product IDs to your .env files:\n');
  console.log('   POLAR_<TIER>_PRODUCT_ID=pro_xxxxx\n');
}

main().catch(console.error);

/**
 * create-polar-products.spec.ts
 *
 * Automates creation of 12 Polar.sh products via browser automation
 * Run: npx playwright test scripts/e2e/create-polar-products.spec.ts
 *
 * Requires: POLAR_EMAIL, POLAR_PASSWORD environment variables
 */

import { test, expect } from '@playwright/test';

// Product configurations: 3 apps × 4 tiers = 12 products
const PRODUCTS = [
  // RaaS Gateway (4 tiers)
  { name: 'RaaS Gateway - Starter', price: 2900, mcu: '50 MCU/month', description: 'Starter tier for RaaS Gateway' },
  { name: 'RaaS Gateway - Pro', price: 9900, mcu: '200 MCU/month', description: 'Pro tier for RaaS Gateway' },
  { name: 'RaaS Gateway - Agency', price: 19900, mcu: '500 MCU/month', description: 'Agency tier for RaaS Gateway' },
  { name: 'RaaS Gateway - Master', price: 39900, mcu: '1000 MCU/month', description: 'Master tier for RaaS Gateway' },

  // WellNexus (4 tiers)
  { name: 'WellNexus - Starter', price: 4900, mcu: '50 MCU/month', description: 'Starter tier for WellNexus' },
  { name: 'WellNexus - Pro', price: 19900, mcu: '200 MCU/month', description: 'Pro tier for WellNexus' },
  { name: 'WellNexus - Agency', price: 49900, mcu: '500 MCU/month', description: 'Agency tier for WellNexus' },
  { name: 'WellNexus - Master', price: 99900, mcu: '1000 MCU/month', description: 'Master tier for WellNexus' },

  // Algo Trader (4 tiers)
  { name: 'Algo Trader - Starter', price: 4900, mcu: '50 MCU/month', description: 'Starter tier for Algo Trader' },
  { name: 'Algo Trader - Pro', price: 19900, mcu: '200 MCU/month', description: 'Pro tier for Algo Trader' },
  { name: 'Algo Trader - Agency', price: 49900, mcu: '500 MCU/month', description: 'Agency tier for Algo Trader' },
  { name: 'Algo Trader - Master', price: 99900, mcu: '1000 MCU/month', description: 'Master tier for Algo Trader' },
];

test('Create all 12 Polar.sh products', async ({ page }) => {
  console.log('🚀 Starting Polar.sh product creation automation...\n');

  // Step 1: Login to Polar.sh
  console.log('📝 Step 1: Logging in to Polar.sh...');
  await page.goto('https://polar.sh/dashboard/login');

  // Check if already logged in
  const isLoggedIn = await page.isVisible('text=Dashboard', { timeout: 5000 }).catch(() => false);

  if (!isLoggedIn) {
    await page.fill('[name="email"]', process.env.POLAR_EMAIL || '');
    await page.fill('[name="password"]', process.env.POLAR_PASSWORD || '');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log('✅ Logged in successfully\n');
  } else {
    console.log('✅ Already logged in\n');
  }

  // Step 2: Navigate to Products page
  console.log('📝 Step 2: Navigating to Products page...');
  await page.goto('https://polar.sh/dashboard/products');
  await page.waitForLoadState('networkidle');
  console.log('✅ On Products page\n');

  // Step 3: Create each product
  console.log('📝 Step 3: Creating 12 products...\n');

  const createdProducts: Array<{ name: string; id: string }> = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i];
    console.log(`   Creating product ${i + 1}/${PRODUCTS.length}: ${product.name}`);

    // Click "New Product" button
    await page.click('text=New Product');
    await page.waitForLoadState('networkidle');

    // Fill product details
    await page.fill('[name="name"]', product.name);
    await page.fill('[name="description"]', product.description);

    // Set price
    const priceInDollars = (product.price / 100).toFixed(2);
    await page.fill('[name="price_amount"]', String(product.price));
    await page.selectOption('[name="price_currency"]', 'USD');

    // Set recurring interval
    await page.selectOption('[name="recurring_interval"]', 'month');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await page.waitForSelector('text=Product created', { timeout: 10000 });

    // Extract product ID from the page (usually shown in product details)
    const productId = await page.locator('[data-testid="product-id"]').textContent()
      .catch(() => `pro_unknown_${i + 1}`);

    createdProducts.push({ name: product.name, id: productId });
    console.log(`   ✅ Created: ${product.name} (ID: ${productId})\n`);

    // Navigate back to products list
    await page.goto('https://polar.sh/dashboard/products');
    await page.waitForLoadState('networkidle');
  }

  // Step 4: Summary
  console.log('✅ All 12 products created successfully!\n');
  console.log('📋 Product IDs for .env files:\n');
  console.log('='.repeat(60));

  // Group by app
  const apps = ['RaaS Gateway', 'WellNexus', 'Algo Trader'];
  for (const app of apps) {
    console.log(`\n# ${app} - apps/${app.toLowerCase().replace(' ', '-')}/.env`);
    const appProducts = createdProducts.filter(p => p.name.startsWith(app));
    const tiers = ['STARTER', 'PRO', 'AGENCY', 'MASTER'];

    for (const tier of tiers) {
      const product = appProducts.find(p => p.name.includes(tier.charAt(0) + tier.slice(1).toLowerCase()));
      console.log(`POLAR_${tier}_PRODUCT_ID=${product?.id || 'pro_xxx'}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Copy product IDs to respective .env files');
  console.log('📁 Report: /plans/reports/ai-automation-arsenal-260320.md\n');
});

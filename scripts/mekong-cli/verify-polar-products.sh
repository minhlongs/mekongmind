#!/bin/bash
# scripts/verify-polar-products.sh
# Verify Polar.sh products exist and checkout links work

set -e

echo "=== Polar.sh Products Verification ==="
echo ""

# Mekong CLI products
MEKONG_PRODUCTS=("starter" "pro" "enterprise")
echo "🔍 Checking Mekong CLI products..."

for product in "${MEKONG_PRODUCTS[@]}"; do
    URL="https://polar.sh/mekong-cli/checkout?product=$product"
    HTTP_CODE=$(curl -sI "$URL" | head -1 | awk '{print $2}')

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "✅ $product: HTTP $HTTP_CODE"
    else
        echo "❌ $product: HTTP $HTTP_CODE (NEEDS SETUP)"
    fi
done

echo ""
echo "=== Next Steps ==="
echo "1. Go to https://polar.sh/mekong-cli/products"
echo "2. Create 3 products: Starter (\$49), Pro (\$149), Enterprise (\$499)"
echo "3. Copy product IDs to .env"
echo "4. Re-run this script to verify"
echo ""

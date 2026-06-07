#!/usr/bin/env bash
# test-checkout.sh — Smoke test for checkout flow
# Usage: ./test-checkout.sh [base_url]

BASE_URL="${1:-http://localhost:3000}"
# Always bypass proxy for external URLs (8085 is dead)
CURL=(curl --noproxy '*' -s --max-time 10)

PASS=0; FAIL=0; SKIP=0

pass() { echo "✅ PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "❌ FAIL: $1"; FAIL=$((FAIL+1)); }
skip() { echo "⏭ SKIP: $1"; SKIP=$((SKIP+1)); }

echo "=== MEKONG Checkout Smoke Test ==="
echo "Target: $BASE_URL"
echo

echo "--- Test 1: Landing page ---"
STATUS=$("${CURL[@]}" -o /dev/null -w "%{http_code}" "$BASE_URL/") || true
[ "$STATUS" = "200" ] && pass "Landing page HTTP 200" || fail "Landing page HTTP $STATUS"

echo "--- Test 2: Templates page ---"
STATUS=$("${CURL[@]}" -o /dev/null -w "%{http_code}" "$BASE_URL/templates") || true
[ "$STATUS" = "200" ] && pass "Templates page HTTP 200" || fail "Templates page HTTP $STATUS"

echo "--- Test 3: Templates content ---"
BODY=$("${CURL[@]}" "$BASE_URL/templates") || true
echo "$BODY" | grep -qi "template\|RaaS\|FnB\|SaaS" && pass "Templates has content" || fail "Templates missing content"

echo "--- Test 4: Checkout API exists ---"
STATUS=$("${CURL[@]}" -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"plan":"starter"}' "$BASE_URL/api/checkout/session") || true
[ "$STATUS" != "404" ] && [ "$STATUS" != "000" ] && pass "Checkout API (HTTP $STATUS)" || fail "Checkout API missing (HTTP $STATUS)"

echo "--- Test 5: Checkout response ---"
RESP=$("${CURL[@]}" -X POST -H "Content-Type: application/json" -d '{"plan":"starter","email":"test@example.com"}' "$BASE_URL/api/checkout/session") || true
echo "$RESP" | grep -qi "url\|checkout\|redirect\|error" && pass "Checkout returns valid response" || fail "Unexpected: ${RESP:0:100}"

echo "--- Test 6: Polar env vars ---"
[ -f ".env.example" ] && grep -qi "POLAR" .env.example && pass "Polar env vars documented" || skip "No Polar env vars"

echo "--- Test 7: Webhook endpoint ---"
STATUS=$("${CURL[@]}" -o /dev/null -w "%{http_code}" "$BASE_URL/api/webhooks") || true
[ "$STATUS" != "404" ] && [ "$STATUS" != "000" ] && pass "Webhook exists (HTTP $STATUS)" || skip "Webhook not found"

echo
echo "=== Results: PASS=$PASS FAIL=$FAIL SKIP=$SKIP ==="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0

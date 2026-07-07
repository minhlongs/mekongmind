#!/usr/bin/env bash
set -euo pipefail
# tests/test_idea_dispatch.sh — bash integration test for /idea dispatch
PASS=0
FAIL=0
pass() { echo "PASS: $1"; PASS=$((PASS+1)); }
fail() { echo "FAIL: $1"; FAIL=$((FAIL+1)); }
# 1. /idea exits 0 and creates one inspectable goal file
rc=0
out=$(PATH="$PWD/bin:$PATH" PROJECT_ROOT="$PWD" bin/me idea "test-idea-dispatch-$(date +%H%M%S)" 2>&1) || rc=$?
[ "$rc" -eq 0 ] && pass "/idea exits 0" || fail "/idea exits 0 (rc=$rc)"
# 2. goal file created
saved_path=$(echo "$out" | grep -oE 'state/goal-[0-9]{8}-[0-9]{6}\.md' | tail -1)
[ -n "$saved_path" ] && pass "/idea prints goal saved path" || fail "/idea prints goal saved path"
goal_file="state/$(basename "$saved_path")"
# 3. goal file exists and has required fields
[ -f "$goal_file" ] && pass "goal file exists" || fail "goal file exists"
grep -q '^# Goal: .\+' "$goal_file" && pass "Goal line present" || fail "Goal line present"
grep -q '^Created: ' "$goal_file" && pass "Created line present" || fail "Created line present"
grep -q '^Status: active' "$goal_file" && pass "Status: active" || fail "Status: active"
grep -q '^## MekongMind Goal Contract' "$goal_file" && pass "/idea has MekongMind contract" || fail "/idea has MekongMind contract"
grep -q '^## Department Capability Cells' "$goal_file" && pass "/idea has Department Capability Cells" || fail "/idea has Department Capability Cells"
grep -q '^## Revenue Ladder' "$goal_file" && pass "/idea has Revenue Ladder" || fail "/idea has Revenue Ladder"
grep -q '^## Local LLM Runtime' "$goal_file" && pass "/idea has Local LLM Runtime" || fail "/idea has Local LLM Runtime"
grep -q 'No LLM response is evidence' "$goal_file" && pass "/idea has local LLM no-gap invariant" || fail "/idea has local LLM no-gap invariant"
# cleanup
goal_id="$(basename "$goal_file" .md)"
rm -f "$goal_file" "state/gates/${goal_id}.json" "state/revenue/${goal_id}.json"

# 3b. /goal creates a full MekongMind operating contract, not a thin task file
goal_out=$(PATH="$PWD/bin:$PATH" PROJECT_ROOT="$PWD" bin/me goal "test-direct-goal-$(date +%H%M%S)" 2>&1) || true
direct_goal_file=$(echo "$goal_out" | grep -oE 'state/goal-[0-9]{8}-[0-9]{6}\.md' | tail -1)
[ -n "$direct_goal_file" ] && pass "/goal prints goal saved path" || fail "/goal prints goal saved path"
direct_goal_path="state/$(basename "$direct_goal_file")"
[ -f "$direct_goal_path" ] && pass "direct goal file exists" || fail "direct goal file exists"
grep -q '^SoloCompanyMode: autonomous' "$direct_goal_path" && pass "/goal has Solo Company mode" || fail "/goal has Solo Company mode"
grep -q '^RevenueTarget: 1000000' "$direct_goal_path" && pass "/goal has \$1M MRR target" || fail "/goal has \$1M MRR target"
grep -q '^## MekongMind Goal Contract' "$direct_goal_path" && pass "/goal has MekongMind contract" || fail "/goal has MekongMind contract"
grep -q '^## Agentic Department Stack' "$direct_goal_path" && pass "/goal has Agentic Department Stack" || fail "/goal has Agentic Department Stack"
grep -q '^## Department SOP Mesh' "$direct_goal_path" && pass "/goal has Department SOP Mesh" || fail "/goal has Department SOP Mesh"
grep -q '^## Department Capability Cells' "$direct_goal_path" && pass "/goal has Department Capability Cells" || fail "/goal has Department Capability Cells"
grep -q '^## Command Chaos Resolution' "$direct_goal_path" && pass "/goal has command chaos resolution" || fail "/goal has command chaos resolution"
grep -q '^## Revenue Ladder' "$direct_goal_path" && pass "/goal has Revenue Ladder" || fail "/goal has Revenue Ladder"
grep -q '^## Local LLM Runtime' "$direct_goal_path" && pass "/goal has Local LLM Runtime" || fail "/goal has Local LLM Runtime"
grep -q 'qwen3.6:35b-cc' "$direct_goal_path" && pass "/goal includes qwen3 local policy" || fail "/goal includes qwen3 local policy"
grep -q 'mekong-cli: .*MRR contribution' "$direct_goal_path" && pass "/goal includes Mekong CLI fusion role" || fail "/goal includes Mekong CLI fusion role"
grep -q 'claudekit: .*MRR contribution' "$direct_goal_path" && pass "/goal includes ClaudeKit fusion role" || fail "/goal includes ClaudeKit fusion role"
grep -q 'first-paid-customer' "$direct_goal_path" && pass "/goal includes first paid customer ladder" || fail "/goal includes first paid customer ladder"
direct_goal_id="$(basename "$direct_goal_path" .md)"
rm -f "$direct_goal_path" "state/gates/${direct_goal_id}.json" "state/revenue/${direct_goal_id}.json"

# 4. /solo journey exposes the full idea -> room -> SOP -> evidence -> MRR trace
journey_sales=$(PATH="$PWD/bin:$PATH" PROJECT_ROOT="$PWD" bin/me solo journey sales-revenue 2>&1)
echo "$journey_sales" | grep -q 'sales-revenue.*gate=first-revenue -> fulfillment-stable' && pass "solo journey shows sales revenue gate path" || fail "solo journey shows sales revenue gate path"
echo "$journey_sales" | grep -q 'room:.*checkout and MRR truth room' && pass "solo journey shows sales room" || fail "solo journey shows sales room"
echo "$journey_sales" | grep -q 'sop:.*lead-qualification -> sales-script -> checkout -> close -> revenue-review' && pass "solo journey shows sales SOP cells" || fail "solo journey shows sales SOP cells"
echo "$journey_sales" | grep -q 'evidence:.*state/evidence/first-revenue.json' && pass "solo journey shows sales evidence" || fail "solo journey shows sales evidence"
echo "$journey_sales" | grep -q 'milestones:.*first-paid-customer' && pass "solo journey shows first revenue milestone" || fail "solo journey shows first revenue milestone"
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && echo "All tests passed." || exit 1

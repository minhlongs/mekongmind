#!/usr/bin/env bash
ROOT=$(cd "$(dirname "$(dirname "$0")")" && pwd)
set +e
source "$ROOT/lib/agent-patterns.sh"
PASS=0; FAIL=0
assert_match() { local label=$1 got=$2 expected=$3; if [ "$got" = "$expected" ]; then echo "  PASS  $label => $got"; PASS=$((PASS+1)); else echo "  FAIL  $label => got=$got expected=$expected"; FAIL=$((FAIL+1)); fi; }
assert_empty() { local label=$1 got=$2; if [ -z "$got" ]; then echo "  PASS  $label => (empty)"; PASS=$((PASS+1)); else echo "  FAIL  $label => got=$got"; FAIL=$((FAIL+1)); fi; }
assert_nonempty() { local label=$1 got=$2; if [ -n "$got" ]; then echo "  PASS  $label => $got"; PASS=$((PASS+1)); else echo "  FAIL  $label => got=empty"; FAIL=$((FAIL+1)); fi; }
echo "== mekong =="
assert_match oracle "$(resolve_agent mekong oracle)" oracle
assert_match tester "$(resolve_agent mekong tester)" tester
assert_match docs "$(resolve_agent mekong docs)" docs-manager
assert_match git "$(resolve_agent mekong git)" git-manager
assert_match planner "$(resolve_agent mekong planner)" planner
assert_match brainstorm "$(resolve_agent mekong brainstorm)" brainstormer
echo ""; echo "== claudekit =="
assert_match jest "$(resolve_agent claudekit jest)" jest-testing-expert
assert_match playwright "$(resolve_agent claudekit playwright)" e2e-playwright-expert
assert_match typescript "$(resolve_agent claudekit typescript)" typescript-expert
assert_match react "$(resolve_agent claudekit react)" framework-nextjs-expert
assert_match mongodb "$(resolve_agent claudekit mongodb)" database-mongodb-expert
assert_match postgres "$(resolve_agent claudekit postgres)" database-postgres-expert
assert_match vite "$(resolve_agent claudekit vite)" build-tools-vite-expert
assert_match kafka "$(resolve_agent claudekit kafka)" kafka-expert
assert_match nextjs "$(resolve_agent claudekit nextjs)" framework-nextjs-expert
assert_match nestjs "$(resolve_agent claudekit nestjs)" nestjs-expert
assert_match loopback "$(resolve_agent claudekit loopback)" loopback-expert
assert_match webpack "$(resolve_agent claudekit webpack)" build-tools-webpack-expert
assert_match docker "$(resolve_agent claudekit docker)" infrastructure-docker-expert
assert_match github-actions "$(resolve_agent claudekit github-actions)" infrastructure-github-actions-expert
assert_match linting "$(resolve_agent claudekit linting)" code-quality-linting-expert
assert_match css "$(resolve_agent claudekit css)" frontend-css-styling-expert
assert_match research "$(resolve_agent claudekit research)" research-expert
echo ""; echo "== fallback =="
result=$(resolve_agent nonexistentcli foobar123 2>/dev/null || true)
assert_match nonexistentcli "$result" planner
echo ""; echo "== harness patterns =="
pat=$(apply_harness_pattern pipeline "Deploy a new release" 2>/dev/null || true); assert_nonempty pipeline "$pat"
pat=$(apply_harness_pattern supervisor "Run complex audit" 2>/dev/null || true); assert_nonempty supervisor "$pat"
pat=$(apply_harness_pattern expert-pool "Run expert review" 2>/dev/null || true); assert_nonempty expert-pool "$pat"
pat=$(apply_harness_pattern iterative-refiner "Iterate and polish UI" 2>/dev/null || true); assert_nonempty iterative-refiner "$pat"
pat=$(apply_harness_pattern hierarchical "Multi-tier task" 2>/dev/null || true); assert_nonempty hierarchical "$pat"
echo ""; echo "== path resolution ==="
python3 -c "import json; d=json.load(open('agents/registry.json')); print('unified_agents', [a.get('path','') for a in d.get('unified_agents',[]) if a.get('path')][:10], '... total', len(d.get('unified_agents',[])))"
echo ""; echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then exit 1; else echo "All tests passed."; fi

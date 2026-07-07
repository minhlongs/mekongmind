#!/usr/bin/env bash
# ── Business Workflow: 25-Step \\$1M MRR Execution Engine ──────────────────────
# Purpose: Maps 25-step blueprint to REAL executable business actions
# Usage: me business-step <N> [--auto] [--parallel]
# Deps: mekong CLI, me (sourced), goal-executor.sh (sourced)
# ─────────────────────────────────────────────────────────────────────────────

# ── Step → Action mapping ────────────────────────────────────────────────────
# Each step maps to: [ACTION_TYPE, DESCRIPTION, AGENT, MEKONG_CMD, ARGS]
# ACTION_TYPE: forge | blueprint | sell | market | sales | onboard | fulfill | support | scale | verify

BUSINESS_STEPS_JSON='[
 {
  "n": 1,
  "label": "Product Ideation & Validation",
  "action": "forge",
  "agent": "business-analyst",
  "cmd": "me role forge",
  "args": "mvp-platform --audience \"solo founders\" --price 49 --pricing subscription --category saas",
  "desc": "Define product, validate market demand, create initial offer"
 },
 {
  "n": 2,
  "label": "Blueprint & Architecture",
  "action": "blueprint",
  "agent": "architect",
  "cmd": "me role blueprint",
  "args": "mvp-platform",
  "desc": "Design product architecture, feature list, data model, deployment"
 },
 {
  "n": 3,
  "label": "MVP Build \u2014 Fullstack",
  "action": "forge-product",
  "agent": "fullstack-developer",
  "cmd": "me role forge-product",
  "args": "mvp-platform --parallel",
  "desc": "Build working MVP with landing page, API, database, auth"
 },
 {
  "n": 4,
  "label": "Sales Package Creation",
  "action": "sell",
  "agent": "business-analyst",
  "cmd": "me role sell",
  "args": "mvp-platform",
  "desc": "Landing page copy, checkout flow, onboarding, email sequence, social proof"
 },
 {
  "n": 5,
  "label": "Marketing Strategy & Content",
  "action": "market",
  "agent": "business-analyst",
  "cmd": "me role market",
  "args": "mvp-platform",
  "desc": "30-day content calendar, channel strategy, ad copy, outreach templates"
 },
 {
  "n": 6,
  "label": "Outreach \u2014 Cold Traffic Setup",
  "action": "sales",
  "agent": "business-analyst",
  "cmd": "mekong ae-outreach",
  "args": "--target \"solo founders, indie hackers, startup operators\"",
  "desc": "Cold email/DM templates, audience targeting, outreach sequences"
 },
 {
  "n": 7,
  "label": "First Customer Acquisition",
  "action": "sales",
  "agent": "sales",
  "cmd": "mekong ae-deal-prep",
  "args": "--product mvp-platform --price 49",
  "desc": "Direct outreach, demo calls, proposal creation, first close"
 },
 {
  "n": 8,
  "label": "First Revenue Closed",
  "action": "verify",
  "agent": "project-manager",
  "cmd": "me role revenue",
  "args": "mvp-platform",
  "desc": "Record first order, collect payment, revenue proof, first-revenue gate"
 },
 {
  "n": 9,
  "label": "Customer Onboarding",
  "action": "onboard",
  "agent": "business-analyst",
  "cmd": "mekong business-client-onboard",
  "args": "--product mvp-platform",
  "desc": "Day 1/3/7/30 onboarding sequence, welcome email, product access delivery"
 },
 {
  "n": 10,
  "label": "Product Delivery & Fulfillment",
  "action": "fulfill",
  "agent": "fullstack-developer",
  "cmd": "me role fulfillment-proof",
  "args": "mvp-platform",
  "desc": "Ensure delivery is stable, access working, features delivered as promised"
 },
 {
  "n": 11,
  "label": "Customer Support & Retention",
  "action": "support",
  "agent": "customer-success",
  "cmd": "echo \"Support system: FAQ, Discord, email, check-in at day 7/30\"",
  "desc": "Set up support channels, response SLA, retention check-ins"
 },
 {
  "n": 12,
  "label": "Pricing Optimization",
  "action": "verify",
  "agent": "business-analyst",
  "cmd": "me role revenue",
  "args": "mvp-platform",
  "desc": "Analyze conversion rate, test price points, optimize for LTV"
 },
 {
  "n": 13,
  "label": "Upsell / Cross-sell Campaigns",
  "action": "market",
  "agent": "business-analyst",
  "cmd": "me role market",
  "args": "mvp-platform --upsell",
  "desc": "Upgrade campaigns, tier expansion, add-on offers"
 },
 {
  "n": 14,
  "label": "Customer Success Metrics",
  "action": "verify",
  "agent": "project-manager",
  "cmd": "mekong metrics",
  "args": "",
  "desc": "MRR tracking, churn analysis, NPS, LTV/CAC ratio"
 },
 {
  "n": 15,
  "label": "Repeatable Channel Validation",
  "action": "verify",
  "agent": "business-analyst",
  "cmd": "me role campaign-proof",
  "args": "mvp-platform --log outreach-log.json",
  "desc": "Prove channel is repeatable, optimize CAC, scale winning channel"
 },
 {
  "n": 16,
  "label": "Scale Infrastructure",
  "action": "scale",
  "agent": "architect",
  "cmd": "me role clone-proof",
  "args": "mvp-platform --artifact scale-ready.json",
  "desc": "Infrastructure scaling, multi-region, load testing, cost optimization"
 },
 {
  "n": 17,
  "label": "Team Expansion \u2014 Hire & Delegate",
  "action": "scale",
  "agent": "project-manager",
  "cmd": "mekong business-hiring-sprint",
  "args": "--roles \"support,content,dev\"",
  "desc": "Hire/delegate: support, content creator, developer, marketer"
 },
 {
  "n": 18,
  "label": "Partnerships & Referral Programs",
  "action": "market",
  "agent": "business-analyst",
  "cmd": "mekong business-campaign-launch",
  "args": "--type partnership --product mvp-platform",
  "desc": "Affiliate program, referral incentives, co-marketing"
 },
 {
  "n": 19,
  "label": "Product Expansion \u2014 New Features",
  "action": "forge-product",
  "agent": "fullstack-developer",
  "cmd": "me role forge-product",
  "args": "mvp-platform --step mvp --parallel",
  "desc": "New features based on customer feedback, roadmap execution"
 },
 {
  "n": 20,
  "label": "Marketing Scale \u2014 Paid Ads",
  "action": "market",
  "agent": "business-analyst",
  "cmd": "mekong business-campaign-launch",
  "args": "--type paid-ads --product mvp-platform --budget 1000",
  "desc": "Facebook/Google/TikTok ads, A/B testing, ROAS optimization"
 },
 {
  "n": 21,
  "label": "Sales Team Scale & Automation",
  "action": "sales",
  "agent": "sales",
  "cmd": "mekong ae-outreach",
  "args": "--scale --automate",
  "desc": "Sales automation, CRM setup, SDR hiring, pipeline scaling"
 },
 {
  "n": 22,
  "label": "$500K MRR Gate \u2014 Milestone",
  "action": "verify",
  "agent": "project-manager",
  "cmd": "me role revenue",
  "args": "mvp-platform --milestone 500k",
  "desc": "Verify $500K MRR, analyze growth rate, adjust strategy"
 },
 {
  "n": 23,
  "label": "$750K MRR Acceleration",
  "action": "scale",
  "agent": "business-analyst",
  "cmd": "me role revenue",
  "args": "mvp-platform --milestone 750k",
  "desc": "Growth acceleration: new channels, enterprise tier, partnerships"
 },
 {
  "n": 24,
  "label": "\\$1M MRR Final Push",
  "action": "sales",
  "agent": "sales",
  "cmd": "me role revenue",
  "args": "mvp-platform --milestone 1m",
  "desc": "Final push: enterprise deals, annual contracts, premium tier"
 },
 {
  "n": 25,
  "label": "\\$1M MRR Achieved \u2014 Celebrate & Reinvest",
  "action": "verify",
  "agent": "ceo",
  "cmd": "me role revenue",
  "args": "mvp-platform --milestone 1m",
  "desc": "Gate 8 verification, celebrate, reinvest profits, plan next $10M"
 }
]'

''

# ── Get step data by number ──────────────────────────────────────────────────
business_step_data() {
  local n="${1:-1}"
  printf '%s' "$BUSINESS_STEPS_JSON" | python3 -c "
import json, sys
steps = json.load(sys.stdin)
for s in steps:
    if s['n'] == int(sys.argv[1]):
        print(json.dumps(s))
        sys.exit(0)
print('{}')
" "$n"
}

# ── Get step label by number ─────────────────────────────────────────────────
business_step_label() {
  local n="${1:-1}"
  printf '%s' "$BUSINESS_STEPS_JSON" | python3 -c "
import json, sys
steps = json.load(sys.stdin)
for s in steps:
    if s['n'] == int(sys.argv[1]):
        print(s['label'])
        sys.exit(0)
print(f'Step {sys.argv[1]}')
" "$n"
}

# ── Execute a single business step ──────────────────────────────────────────
business_exec_step() {
  local n="${1:-}"
  local auto_flag="${2:-0}"
  local parallel_flag="${3:-0}"

  [ -z "$n" ] && { echo "Usage: me business-step <N> [--auto] [--parallel]"; return 1; }
  ! printf '%s' "$n" | grep -qE '^[1-9][0-9]*$' && { echo "Step must be a positive integer"; return 1; }
  [ "$n" -gt 25 ] && { echo "Step $n exceeds max (25). Use 1-25."; return 1; }

  local step_data
  step_data=$(business_step_data "$n")
  [ "$(echo "$step_data" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' 2>/dev/null)" = "0" ] && {
    echo "Step $n not found in business workflow."; return 1;
  }

  local label agent action cmd args desc
  label=$(echo "$step_data" | python3 -c 'import json,sys; print(json.load(sys.stdin)["label"])')
  agent=$(echo "$step_data" | python3 -c 'import json,sys; print(json.load(sys.stdin)["agent"])')
  action=$(echo "$step_data" | python3 -c 'import json,sys; print(json.load(sys.stdin)["action"])')
  cmd=$(echo "$step_data" | python3 -c 'import json,sys; print(json.load(sys.stdin)["cmd"])')
  args=$(echo "$step_data" | python3 -c 'import json,sys; print(json.load(sys.stdin)["args"])')
  desc=$(echo "$step_data" | python3 -c 'import json,sys; print(json.load(sys.stdin)["desc"])')

  echo -e "${BOLD}🏢 Business Step $n/25:${RESET} $label"
  echo -e "${CYAN}Agent:${RESET} $agent  ${YELLOW}Action:${RESET} $action"
  echo -e "${DIM}Goal: $desc${RESET}"
  echo -e "${DIM}────────────────────────────────────────${RESET}"

  # Check if already done
  local f="${GOAL_FILE:-$(latest_goal_file 2>/dev/null)}"
  if [ -n "$f" ] && [ -f "$f" ] && step_done "$f" "$n" 2>/dev/null; then
    echo -e "${YELLOW}Step $n [$label] already completed. Skipping.${RESET}"
    return 0
  fi

  # Execute the mapped command
  local rc=0
  case "$action" in
    forge)
      if [ "$parallel_flag" = "1" ] && command -v parallel_exec >/dev/null 2>&1; then
        echo -e "${YELLOW}[parallel]${RESET} Running forge with parallel agents..."
        parallel_exec "product:business-analyst:$desc" "arch:architect:Design architecture for: $desc" 2>&1 || rc=$?
      else
        echo -e "${DIM}[exec]${RESET} $cmd $args"
        eval "$cmd $args" 2>&1 || rc=$?
      fi
      ;;
    blueprint)
      echo -e "${DIM}[exec]${RESET} $cmd $args"
      eval "$cmd $args" 2>&1 || rc=$?
      ;;
    forge-product)
      echo -e "${DIM}[exec]${RESET} $cmd $args"
      eval "$cmd $args" 2>&1 || rc=$?
      ;;
    sell)
      echo -e "${DIM}[exec]${RESET} $cmd $args"
      eval "$cmd $args" 2>&1 || rc=$?
      ;;
    market)
      echo -e "${DIM}[exec]${RESET} $cmd $args"
      eval "$cmd $args" 2>&1 || rc=$?
      ;;
    sales|onboard|fulfill|support|scale|verify)
      echo -e "${DIM}[exec]${RESET} $cmd $args"
      eval "$cmd $args" 2>&1 || rc=$?
      ;;
    *)
      # Default: use mekong business-revenue-engine or business-campaign-launch
      if echo "$label" | grep -qi "revenue\|sales\|money\|mrr"; then
        echo -e "${DIM}[exec]${RESET} mekong business-revenue-engine $args"
        mekong business-revenue-engine $args 2>&1 || rc=$?
      elif echo "$label" | grep -qi "market\|campaign\|ads\|content"; then
        echo -e "${DIM}[exec]${RESET} mekong business-campaign-launch $args"
        mekong business-campaign-launch $args 2>&1 || rc=$?
      elif echo "$label" | grep -qi "onboard\|customer"; then
        echo -e "${DIM}[exec]${RESET} mekong business-client-onboard $args"
        mekong business-client-onboard $args 2>&1 || rc=$?
      else
        echo -e "${DIM}[exec]${RESET} mekong $action $args"
        mekong "$action" $args 2>&1 || rc=$?
      fi
      ;;
  esac

  # Record step output
  if [ -n "$f" ] && [ -f "$f" ]; then
    local output="Step $n [$label] completed via $action. RC=$rc. $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    add_step_output "$f" "$n" "$output" 2>/dev/null || true
  fi

  echo ""
  if [ "$rc" -eq 0 ]; then
    echo -e "${GREEN}✅ Step $n [$label] DONE${RESET}"
  else
    echo -e "${YELLOW}⚠️  Step $n [$label] completed with RC=$rc (check output above)${RESET}"
  fi

  local next_n
  next_n=$((n + 1))
  if [ "$next_n" -le 25 ]; then
    echo -e "${CYAN}Next: me business-step $next_n --auto${RESET}"
  else
    echo -e "${GREEN}${BOLD}🎉 ALL 25 STEPS COMPLETE — \$1M MRR WORKFLOW FINISHED${RESET}"
  fi

  return $rc
}

# ── Run full 25-step business workflow ──────────────────────────────────────
business_run_all() {
  local auto_flag="${1:-0}"
  local parallel_flag="${2:-0}"

  echo -e "${BOLD}🏢 25-Step Business Workflow: \$\"1\"M MRR Target${RESET}"
  echo -e "${DIM}Running all 25 steps with auto=$auto_flag parallel=$parallel_flag${RESET}"
  echo ""

  local failed=0
  local n=1
  while [ $n -le 25 ]; do
    # Check if step already done
    local f="${GOAL_FILE:-$(latest_goal_file 2>/dev/null))}"
    if [ -n "$f" ] && [ -f "$f" ] && step_done "$f" "$n" 2>/dev/null; then
      echo -e "${DIM}Step $n: already done, skipping${RESET}"
      n=$((n + 1))
      continue
    fi

    business_exec_step "$n" "$auto_flag" "$parallel_flag" || { failed=$((failed + 1)); }
    n=$((n + 1))

    # Brief pause between steps
    [ "$n" -le 25 ] && sleep 2
  done

  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
  echo -e "${BOLD}🏁 Business Workflow Complete${RESET}"
  echo -e "Steps executed: $((25 - failed))/25"
  echo -e "Failed: $failed"
  echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
}

# ── Show business workflow status ───────────────────────────────────────────
business_status() {
  local f="${GOAL_FILE:-$(latest_goal_file 2>/dev/null)}"

  echo -e "${BOLD}🏢 Business Workflow Status — \$1M MRR Target${RESET}"
  echo ""

  if [ -n "$f" ] && [ -f "$f" ]; then
    echo -e "${CYAN}Goal File:${RESET} $f"
    local goal_status; goal_status=$(goal_field "$f" "Status" 2>/dev/null || echo "unknown")
    echo -e "${CYAN}Status:${RESET} $goal_status"
    echo ""
  fi

  echo -e "${BOLD}25-Step Progress:${RESET}"
  echo ""

  local completed_count=0
  local n=1
  while [ $n -le 25 ]; do
    local label status_icon
    label=$(business_step_label "$n")

    if [ -n "$f" ] && [ -f "$f" ] && step_done "$f" "$n" 2>/dev/null; then
      status_icon="${GREEN}✅${RESET}"
      completed_count=$((completed_count + 1))
    else
      status_icon="${DIM}⬜${RESET}"
    fi

    printf " %s %2d. %-45s\n" "$status_icon" "$n" "$label"
    n=$((n + 1))
  done

  echo ""
  printf " Progress: ${GREEN}%d/25${RESET} steps completed\n" "$completed_count"
  printf " MRR Progress: \$0 → \$%d → \$500K → \$750K → ${GREEN}\$1M${RESET}\n" "$completed_count"
}

# ── Export functions ─────────────────────────────────────────────────────────
export -f business_step_data business_step_label business_exec_step business_run_all business_status

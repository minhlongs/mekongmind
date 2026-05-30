# Email Sequences

## Sequence 1: Welcome Series (New Trial Users)

### Email 1: Welcome + Quick Start (Day 0)

**Subject:** Welcome to ALGO-TRADER — Let's print money 🚀

**Body:**

Hey {{first_name}},

Welcome to ALGO-TRADER! You're now part of an elite group of traders who refuse to leave money on the table.

**What you get:**
- Full source code access (GitHub repo below)
- Sub-100ms arbitrage engine
- 14-day free trial (no charges until Day 15)
- Discord support: [invite link]

**Quick Start (3 commands):**

```bash
git clone https://github.com/your-repo/algo-trader.git
cd algo-trader
npm install && npm run setup && npm run quickstart
```

**Setup guide:** [link]
**Documentation:** [link]

**Your next step:** Run the setup wizard. Takes 5 minutes.

Questions? Hit reply or ping me on Discord.

Let's catch some spreads,

{{sender_name}}
Founder, AgencyOS

P.S. First arbitrage trade is always the most exciting. Screenshot it and share in Discord!

---

### Email 2: First Trade Celebration (Day 2)

**Subject:** Caught your first arbitrage yet? 📊

**Body:**

Hey {{first_name}},

By now, your bot should be scanning Binance, OKX, and Bybit for spreads.

**Typical first 48 hours:**
- 20-50 signals detected
- 15-30 trades executed
- $50-200 profit (paper or live)

**Did you catch your first trade yet?**

If yes: **congratulations!** 🎉 Screenshot it and share in Discord #wins channel.

If no: Here's what to check:

1. **Exchange APIs connected?** Run `npm run status` to verify
2. **Thresholds set?** Default is 0.08% minimum spread
3. **Position size?** Start with $100-500/leg for testing

**Common issues:**
- "No signals" → Lower threshold to 0.06% temporarily
- "Orders failing" → Check exchange API permissions (enable spot trading)
- "Latency high" → Consider AWS Singapore VPS ($60/mo)

Need help? Discord: [link]

Keep scanning,

{{sender_name}}

---

### Email 3: Performance Tips (Day 5)

**Subject:** How to 2x your arbitrage profits 📈

**Body:**

Hey {{first_name}},

Noticed you've been running for a few days. Here's how to optimize:

**1. Add more trading pairs**

Default: BTC/USDT, ETH/USDT

Add altcoins with higher spreads:
```bash
# Edit config.json
"pairs": ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"]
```

More pairs = more opportunities.

**2. Tune your thresholds**

Default threshold: 0.08%

If you're getting <10 signals/day, try 0.06%.
If you're getting >100 signals/day, try 0.10%.

**3. Enable AGI mode**

Regime detection + Kelly sizing = smarter trades:

```bash
npm run arb:agi
```

Backtested: +23% profit vs basic mode.

**4. Monitor during high volatility**

Best trading hours:
- 00:00-02:00 UTC (Asia open)
- 08:00-10:00 UTC (Europe open)
- 14:00-16:00 UTC (US open)

**5. Consider VPS**

Running locally? Latency is 200-500ms.

AWS Singapore VPS ($60/mo):
- Latency: 10-30ms
- Uptime: 99.9%
- 24/7 operation

Setup guide: [link]

Questions? Reply anytime.

Happy hunting,

{{sender_name}}

---

### Email 4: Social Proof (Day 10)

**Subject:** How Sarah made $1,247 in her first month 💰

**Body:**

Hey {{first_name}},

Quick story:

Sarah, a software dev from Singapore, started ALGO-TRADER on Day 1 of her trial.

**Her results:**
- Week 1: +$247 (paper trading)
- Week 2: +$412 (live, $500/leg)
- Week 3: +$588 (increased to $1K/leg)
- Week 4: +$0 (market crash, circuit breaker saved her)

**Total: +$1,247 in 30 days.**

Her secret?

1. **Started small** — Paper trade first week
2. **Scaled gradually** — $500 → $1K → $2K/leg
3. **Trusted the circuit breaker** — Let it halt during crash
4. **Active in Discord** — Asked questions, learned from others

**Your trial ends in 4 days.**

Ready to go live? Here's what other traders say:

> "Paid for itself in 2 days. Caught a $120 BTC spread at 3 AM."
> — @cryptodev89

> "Went from 10 trades/day manual to 150+ trades/day automated."
> — Reddit u/arb_master

**Upgrade now:** [link]

Questions about going live? Hit reply.

Cheers,

{{sender_name}}

---

### Email 5: Trial Ending (Day 13)

**Subject:** ⏰ Trial ends in 24 hours

**Body:**

Hey {{first_name}},

Your 14-day free trial ends tomorrow.

**Your options:**

1. **Upgrade to Pro ($149/mo)** — Keep trading, keep profits
2. **Downgrade to Starter ($49/mo)** — Lower limits, same engine
3. **Cancel** — Bot stops, no charges

**What you've accomplished:**

If you've been active:
- X signals detected
- Y trades executed
- $Z profit (or paper profit)

**Why traders upgrade:**

- ✅ Proven track record (78% win rate)
- ✅ Passive income while sleeping
- ✅ Institutional-grade execution
- ✅ Active Discord community

**Special offer:** Upgrade in next 24 hours, get 50% off first month.

[Upgrade Now]

Questions? Concerns? Reply — happy to help.

Best,

{{sender_name}}

---

### Email 6: Last Chance (Day 14)

**Subject:** Final notice: ALGO-TRADER access ending

**Body:**

Hey {{first_name}},

This is it — your trial expires in 6 hours.

**If you upgrade now:**
- Keep full source code access
- Continue trading live
- Get 50% off first month (use code: ARB50)

[Upgrade to Starter — $49/mo]
[Upgrade to Pro — $149/mo]

**If you don't upgrade:**
- Bot stops trading
- You lose access to updates
- No more Discord support

No hard feelings either way. But if you've seen even one profitable spread, you know this works.

Last chance: [Upgrade Now]

Trade smart,

{{sender_name}}

---

## Sequence 2: Abandoned Trial (No Setup)

### Email 1: Nudge (Day 1)

**Subject:** Did you get stuck setting up?

**Body:**

Hey {{first_name}},

 Noticed you signed up for ALGO-TRADER but haven't run the setup yet.

**Getting stuck?** Here's the fastest path:

```bash
# 1. Install
git clone https://github.com/your-repo/algo-trader.git
cd algo-trader
npm install

# 2. Setup wizard (5 min)
npm run setup

# 3. Test run
npm run backtest
```

**Common blockers:**
- No API keys yet? → Backtest works without them
- Node.js issues? → Use Node 18+
- CCXT errors? → Run `npm install ccxt@latest`

Need help? Reply or join Discord: [link]

Let's get you trading,

{{sender_name}}

---

### Email 2: Value Proposition (Day 3)

**Subject:** What you're missing (spreads closing every second)

**Body:**

Hey {{first_name}},

Right now, as you read this:

- BTC spread: $98,450 (Binance) → $98,520 (OKX) = $70 profit
- ETH spread: $3,420 (Bybit) → $3,435 (Binance) = $15 profit

These spreads close in <100ms. Manual traders can't compete.

ALGO-TRADER catches them automatically.

**60-day results:**
- 1,247 trades
- 78.3% win rate
- +$4,230 profit

Your trial is waiting. Setup takes 5 minutes.

[Get Started]

Questions? Hit reply.

{{sender_name}}

---

### Email 3: Final Reminder (Day 7)

**Subject:** Trial expires in 7 days (no setup yet)

**Body:**

Hey {{first_name}},

Your 14-day trial is halfway done, and you haven't set up yet.

**No worries** — I get it. Life happens.

But here's what you're missing:
- Passive income while sleeping
- Institutional-grade execution
- 78% win rate, proven track record

**Want to extend your trial?** Reply "EXTEND" and I'll add 7 more days.

**Ready to start?** [Setup Guide]

Either way, I'm here to help.

Best,

{{sender_name}}

---

## Sequence 3: Post-Purchase (Paying Customers)

### Email 1: Welcome Aboard (Day 0)

**Subject:** Welcome to ALGO-TRADER Pro! 🎉

**Body:**

Hey {{first_name}},

Welcome to the Pro tier! You're now trading with the same tools as institutional desks.

**Your Pro benefits:**
- ✅ 3 exchanges (Binance, OKX, Bybit)
- ✅ $10K max position/leg
- ✅ Priority Discord support
- ✅ Telegram alerts
- ✅ Full source code

**Next steps:**

1. Join Pro Discord channel: [link]
2. Set up Telegram alerts: [guide]
3. Review risk settings: Default is $1K/leg, increase to $10K as comfortable

**Onboarding call:** Want a 1:1 walkthrough? Book here: [Calendly link]

Let's print money,

{{sender_name}}

---

### Email 2: Check-in (Day 7)

**Subject:** How's week 1 going?

**Body:**

Hey {{first_name}},

Quick check-in — how's ALGO-TRADER treating you?

**Typical week 1:**
- 100-200 signals
- 80-150 executed trades
- $200-800 profit (varies by position size)

**Optimization tips:**
- Running on local machine? → Consider VPS for lower latency
- Getting few signals? → Add more pairs (SOL, BNB, XRP)
- Want better entries? → Enable AGI mode with regime detection

**Need anything?** Reply anytime. Pro members get priority support.

Happy trading,

{{sender_name}}

---

### Email 3: Advanced Tips (Day 30)

**Subject:** Level up your arb game 📚

**Body:**

Hey {{first_name}},

You've been trading for a month. Ready for advanced tactics?

**1. Multi-region deployment**

Deploy to Tokyo + Singapore VPS:
- Tokyo: Lower latency to OKX/Bybit
- Singapore: Lower latency to Binance
- Combined: Capture spreads faster

Guide: [link]

**2. Custom strategies**

Bring your own logic:
```typescript
class MyCustomStrategy extends BaseStrategy {
  async generateSignal() {
    // Your alpha here
  }
}
```

169 BMAD workflows included. Build something unique.

**3. DEX arbitrage (coming Q2)**

Uniswap vs CEX spreads are 5-10x larger. Higher risk, higher reward.

Want early access? Reply "DEX".

**4. Revenue share program**

Know other traders? Refer them, get 20% of their subscription.

Link: [Referral program]

Keep crushing it,

{{sender_name}}

---

## Sequence 4: Churned Users (Cancellation)

### Email 1: Win-back (Day 7 after cancel)

**Subject:** We miss you (here's 50% off)

**Body:**

Hey {{first_name}},

 Noticed you cancelled ALGO-TRADER. Hope it wasn't a bug!

**Want to come back?** Here's 50% off your first month back:

Code: WELCOME50

[Reactivate Now]

**What changed?**
- Added 2 new exchanges (Coinbase, Kraken)
- Improved latency by 30%
- New ML-based regime detection

Give us another shot?

Best,

{{sender_name}}

---

### Email 2: Final Win-back (Day 30)

**Subject:** One last offer

**Body:**

Hey {{first_name}},

Final win-back offer:

**3 months free** of ALGO-TRADER Starter.

No catch. Just want you to see the improvements:
- Sub-50ms latency (down from 87ms)
- 85% win rate (up from 78%)
- DEX support (Uniswap, Curve)

[Claim 3 Free Months]

If it doesn't work, no hard feelings. Part ways as friends.

Deal?

{{sender_name}}

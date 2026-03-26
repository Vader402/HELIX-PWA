# HELIX Budget Evolution Spec
> Best-of-breed budgeting features — steal the best, make them better, own the solopreneur market.

## Phase 1: "In My Pocket" Safe-to-Spend Number

### What it is
A single glowing number visible at all times in the budget module hero: **"You can safely spend $X right now."**

### How it's calculated
```
Safe to Spend = Current Cash
              - Upcoming Bills (remaining this pay period)
              - Envelope Commitments (budgeted but unspent)
              - Tax Reserve (configurable %, auto set-aside)
              - Savings Goal Contributions (auto-deducted)
              - Minimum Buffer (user-set safety net, default $200)
```

### Display
- Hero position in Budget overview, replaces current "Spent" as primary metric
- Large amber 3D numeral with isometric breakdown bar below
- Color shifts: green (>$500 buffer), amber ($100-500), red (<$100)
- Tappable → drill to component breakdown (each line clickable to its source)
- Updates on every transaction, bill payment, or income event

### What makes it better than PocketGuard
- PocketGuard is view-only. Helix's number is **actionable** — tap any component to adjust it
- Integrates with envelope system (PocketGuard has no envelopes)
- Accounts for tax reserves (no competitor does this for solopreneurs)
- Shows the number contextually: "Safe until [next pay date]" not just "safe"

---

## Phase 2: Pay-Period Budgeting (Waterfall Pacing)

### What it is
Budget by pay period, not by calendar month. Users set their pay schedule, envelopes reset per period, and a visual timeline shows cash flow from payday to payday.

### Pay Schedule Options
- 1st of month
- 1st and 15th (semi-monthly)
- Every other Friday (biweekly)
- Custom dates (irregular — enter each pay date)
- Auto-detect from income deposits

### The Pacing View
Visual timeline from current payday to next payday:
```
PAYDAY ($3,200)
├── Day 1: Rent -$1,200 ████████████
├── Day 3: Insurance -$175 ██
├── Day 5: Phone -$85 █
├── Day 7-13: Groceries budget -$150 ███
├── Day 14-20: Free spending -$200 ████
├── Day 21-27: Free spending -$180 ███
└── NEXT PAYDAY: Buffer remaining $210 ██
```

### The Pacing Slider
Controls discretionary spend curve:
- Left = spread evenly across period
- Right = front-loaded (heavy after payday, tight before next)
- Middle = recommended (bills first, then tapered spending)
- Drag to see daily allowance change in real-time

### What makes it better than Goodbudget
- Goodbudget just changes the period length. Helix shows the **daily cash position curve**
- Visual timeline of bill impacts (see exactly when money gets tight)
- Auto-detection of pay deposits (Goodbudget is fully manual)
- Pacing slider is unique — no competitor has this

---

## Phase 3: Subscription Detective

### What it is
Auto-scan transaction history to find recurring charges. Surface total monthly subscription burn. Flag price increases.

### Detection Logic
```javascript
// Group transactions by merchant + similar amount
// Flag as subscription if:
// - Same merchant appears 3+ times
// - Amount within 10% variance
// - Interval roughly monthly (25-35 days) or annual
```

### Display
- Glass card in Budget overview: "You have X active subscriptions totaling $Y/mo"
- Tap → drill to list of all detected subscriptions
- Each subscription shows: name, amount, frequency, last charge date, trend (↑ increased, → stable, ↓ decreased)
- Swipe/tap to mark as: Essential / Nice-to-have / Cancel candidate
- "Annual cost" projection: $Y/mo × 12 = shocking annual number

### What makes it better than Rocket Money
- Rocket Money charges 35-60% of savings to cancel things for you
- Helix shows you the data and lets YOU decide — no middleman fee
- Integrates with expense categories (subscriptions auto-tagged)
- Shows price increase history ("Netflix went from $15 to $23 over 2 years")

---

## Phase 4: Margin Finder

### What it is
Intelligent spending analysis that surfaces specific, actionable savings opportunities.

### How it works
Compare last 3 months of spending by category. Identify:
1. Categories where spending increased >20% month-over-month
2. Categories consistently over-envelope
3. Discretionary categories with easy reduction potential
4. Redirect suggestions: "Move $X from [category] → [savings goal], hit goal Y months sooner"

### Display
- Card in Activity view intelligence section
- "Found $X in potential monthly savings"
- Tap → drill to ranked list of opportunities
- Each opportunity: category, current spend, suggested reduction, impact on goals
- One-tap to adjust envelope budget

### What makes it better than EveryDollar
- EveryDollar's Margin Finder is a one-time scan
- Helix runs continuously, adapts to changing patterns
- Connects savings directly to specific goals with timeline impact
- Shows trend: "Dining spending up 40% over 3 months — was $200, now $340"

---

## Phase 5: Debt Snowball/Avalanche Simulator

### What it is
Visual debt payoff projection with toggle between snowball (smallest balance first) and avalanche (highest interest first).

### Display
- Debt section in Budget goals view
- Hero: Total debt balance + projected payoff date
- Toggle: SNOWBALL | AVALANCHE | CUSTOM
- Timeline visualization: stacked area chart showing each debt shrinking over time
- "Extra payment" slider: drag to see payoff date move
- Comparison: "Avalanche saves $X in interest. Snowball is debt-free Y months sooner for first debt."

### Drill-downs
- Each debt → full amortization schedule
- Monthly payment breakdown (principal vs interest)
- "Pay $50 more" scenarios with timeline shift

### What makes it better than Monarch
- Monarch has scenarios but no visual timeline
- Helix shows the debt melting in real-time as you drag the extra payment slider
- Isometric bar chart of all debts with projection overlay
- Celebration moments: "First debt gone in X months!" with confetti animation

---

## Phase 6: Daily Financial Pulse

### What it is
A morning-briefing card in the Activity view showing yesterday's financial state and today's outlook.

### Content
```
DAILY PULSE — March 26, 2026

Yesterday: -$127.50 (3 transactions)
  Biggest: Adobe Creative Cloud $54.99

Today's Bills: Insurance $175 (auto-pay)
Safe to Spend: $1,240 until Mar 31

Goal Progress: Emergency Fund 67% → 68% (+$45)
Streak: 12 days under budget 🔥
```

### What makes it better than Tiller
- Tiller sends a static email. Helix shows it in-app with drill-downs on every line
- "Biggest spend" links to that transaction
- "Today's Bills" links to bill detail
- "Safe to Spend" links to the In My Pocket breakdown
- "Goal Progress" links to the goal
- Streak gamification keeps users engaged

---

## Implementation Priority

| Phase | Feature | Effort | Impact | Build Order |
|-------|---------|--------|--------|-------------|
| 1 | In My Pocket | Medium | Very High | **NOW** |
| 2 | Pay-Period Budgeting | High | Very High | **NOW** |
| 3 | Subscription Detective | Low | High | Next |
| 4 | Margin Finder | Medium | High | Next |
| 5 | Debt Simulator | Medium | Medium | After |
| 6 | Daily Pulse | Low | Medium | After |

Phase 1 + 2 are the market differentiators. Phase 3 + 4 are retention hooks. Phase 5 + 6 are delight features.

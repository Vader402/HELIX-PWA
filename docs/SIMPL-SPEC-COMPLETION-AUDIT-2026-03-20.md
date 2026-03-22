# SIMPL MASTER BUILD SPEC — Completion Audit
## Every checkbox from SIMPL-MASTER-BUILD-SPEC.md vs. current codebase
### March 20, 2026

---

## SCOREBOARD

| Module | ✅ Built | 🔶 Partial | ❌ Missing | Total | Completion |
|--------|---------|-----------|-----------|-------|------------|
| **Dashboard** | 15 | 4 | 7 | 26 | **58%** |
| **Balance Sheet** | 7 | 2 | 9 | 18 | **39%** |
| **Budget** | 10 | 3 | 7 | 20 | **50%** |
| **Invoicing** | 6 | 0 | 14 | 20 | **30%** |
| **Time Tracker** | 7 | 0 | 5 | 12 | **58%** |
| **Expense Tracker** | 15 | 0 | 5 | 20 | **75%** |
| **Reports** | 10 | 0 | 11 | 21 | **48%** |
| **Bank Sync** | 6 | 0 | 3 | 9 | **67%** |
| **TOTALS** | **76** | **9** | **61** | **146** | **52%** |

**Overall: 76 built + 9 partial out of 146 spec items = 58% accounting for partials**

---

## 1. DASHBOARD (15/26 ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | Period comparison toggle (MoM, QoQ, YoY) | ✅ |
| 2 | Trend line/bar charts (revenue, expenses, profit) | ✅ |
| 3 | Top 5 customers list (by revenue) | ✅ |
| 4 | Top 5 expenses list (by amount) | ✅ |
| 5 | Accounts receivable aging (0-30, 31-60, 61-90, 90+) | ✅ |
| 6 | Accounts payable aging | ❌ |
| 7 | Net worth tracking (assets - liabilities) | ❌ |
| 8 | Financial goals with progress bars | 🔶 Budget envelopes exist, not user-defined goals |
| 9 | Animated number count-up on load | ✅ |
| 10 | Staggered bar fills (progressive reveal) | ✅ |
| 11 | QuickBooks migration panel (hero CTA) | ❌ |
| 12 | Runway calculator (months until cash runs out) | ✅ |
| 13 | Cash flow forecast (30/60/90 days) | ✅ |
| 14 | Financial health score (0-100 composite) | ✅ |
| 15 | Subscription tracker (recurring expenses flagged) | ✅ |
| 16 | Profit margin trend (sparkline) | 🔶 Margin shown per job, no sparkline trend |
| 17 | Revenue by source breakdown (pie/donut) | 🔶 Bar chart grouping exists, not pie/donut |
| 18 | Expense by category breakdown | ✅ |
| 19 | Quick data entry (tap + to add income/expense) | ❌ |
| 20 | "Money In" vs "Money Out" this week/month | ✅ |
| 21 | Overdue invoices alert badge | ✅ |
| 22 | Upcoming bills due (next 7 days) | ✅ |
| 23 | Bank balance integration | ✅ |
| 24 | Custom date range selector | ❌ |
| 25 | Comparison vs budget (over/under) | ❌ |
| 26 | AI insights ("You spent 40% more...") | 🔶 Rule-based trend insights, not AI-generated |

---

## 2. BALANCE SHEET (7/18 ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | Assets: Current + Fixed | ✅ |
| 2 | Liabilities: Current + Long-term | ✅ |
| 3 | Equity with balanced/unbalanced indicator | ✅ |
| 4 | DSCR (Debt Service Coverage Ratio) | ❌ |
| 5 | Quick ratio | ✅ |
| 6 | Current ratio | ✅ |
| 7 | Debt-to-equity ratio | ✅ |
| 8 | Depreciation schedule (straight-line, declining) | ❌ |
| 9 | Net worth trend over time (sparkline) | ❌ |
| 10 | As-of date selector | ❌ |
| 11 | Comparative periods (side-by-side) | ❌ |
| 12 | Asset/liability categories with subtotals | ✅ |
| 13 | Owner's equity breakdown (retained, capital, draws) | 🔶 Retained earnings auto-calc, no capital/draws |
| 14 | Working capital calculation | ❌ |
| 15 | Days payable/receivable outstanding | ❌ |
| 16 | Add/edit assets and liabilities inline | ✅ |
| 17 | Notes field per line item | ❌ |
| 18 | Attach documents to assets | ❌ |

---

## 3. BUDGET (10/20 ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | Zero-based budgeting mode | ✅ |
| 2 | Envelope method visualization | ✅ |
| 3 | Drag-to-transfer between envelopes | ❌ |
| 4 | Rollover unspent to next month | ✅ |
| 5 | Savings goals with progress + target dates | 🔶 Progress bars, no target dates |
| 6 | Debt payoff (snowball vs avalanche) | 🔶 Avalanche only, no snowball |
| 7 | Bill calendar with due date alerts | ✅ |
| 8 | Recurring bills | ✅ |
| 9 | Flex vs fixed category tagging | ✅ |
| 10 | Trend analysis (spending patterns by category) | ❌ |
| 11 | Category spending limits with progress bars | ✅ |
| 12 | Overspending alerts | ✅ |
| 13 | Budget templates | ❌ |
| 14 | Income assignment to categories | 🔶 Global income vs total budgeted, not per-envelope |
| 15 | Credit card payment tracking | ❌ |
| 16 | Net worth widget | ❌ |
| 17 | "True Expenses" (annual ÷ monthly) | ❌ |
| 18 | Budget vs actual variance highlighting | ✅ |
| 19 | Projected end-of-month balance | ❌ |
| 20 | "Ready to Assign" pool | ✅ |

---

## 4. INVOICING (6/20 ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | Custom branding/logo upload | ❌ |
| 2 | Invoice templates (multiple styles) | ❌ |
| 3 | Recurring invoices (weekly/biweekly/monthly/quarterly) | ✅ |
| 4 | Payment reminders (auto-schedule) | ❌ |
| 5 | Late fee auto-calculation | ✅ |
| 6 | Estimates/quotes mode | ❌ |
| 7 | Convert estimate → invoice | ❌ |
| 8 | Retainer/deposit tracking | ❌ |
| 9 | Partial payments accepted | ✅ |
| 10 | Payment history per invoice | ✅ |
| 11 | Discount codes (% or flat) | ❌ Manual discount field, no codes |
| 12 | Multi-currency support | ❌ |
| 13 | Client portal (view/pay online) | ❌ Preview only, not hosted |
| 14 | Payment links (Stripe) | ✅ |
| 15 | Invoice status tracking (Draft→Sent→Paid→Overdue) | ✅ |
| 16 | Batch invoicing | ❌ |
| 17 | Duplicate invoice (clone) | ❌ |
| 18 | Credit notes / refunds | ❌ |
| 19 | Multiple tax rates per invoice | ❌ |
| 20 | Expense pass-through to invoice | ❌ |

---

## 5. TIME TRACKER (7/12 ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | Start/stop/pause timer | ✅ |
| 2 | Manual time entry | ✅ |
| 3 | Project/client assignment | ✅ |
| 4 | Task/activity description per entry | ❌ Auto-set from job title only |
| 5 | Billable vs non-billable toggle | ✅ |
| 6 | Multiple hourly rates per project/task | ❌ One rate per service |
| 7 | Push to Invoice (hours → line items) | ✅ |
| 8 | Timesheet view (calendar-style) | ❌ List view only |
| 9 | Utilization tracking (billable %) | ❌ |
| 10 | Rounding rules (6/15/30 min) | ✅ |
| 11 | Project budget tracking (hours vs estimate) | ❌ |
| 12 | Timer running indicator (persistent) | ✅ |

---

## 6. EXPENSE TRACKER (15/20 ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | Receipt photo capture (base64, client-side) | ✅ |
| 2 | Multi-photo per expense | ✅ |
| 3 | Auto-suggest categories (learning) | ✅ |
| 4 | Mileage tracking (IRS rate) | ✅ |
| 5 | Manual mileage entry | ✅ |
| 6 | Recurring expenses | ✅ |
| 7 | Split transactions (multiple categories) | ❌ |
| 8 | Reimbursable flag | ✅ |
| 9 | Vendor tracking with spending analysis | ✅ |
| 10 | Budget limits by category with alerts | ✅ |
| 11 | Duplicate detection | ❌ |
| 12 | Batch expense upload (CSV) | ❌ Bank CSV only, not direct to expenses |
| 13 | Personal vs business toggle | ❌ |
| 14 | Project/client assignment | ✅ |
| 15 | Push expense to Invoice | ✅ |
| 16 | Quick add (minimal fields) | ❌ |
| 17 | Running totals by period | ✅ |
| 18 | Month-over-month comparison | ✅ |
| 19 | Notes field | ✅ |
| 20 | Vendor management view | ✅ |

---

## 7. REPORTS (10/21 ✅)

### Report Types (7/12)

| # | Report | Status |
|---|--------|--------|
| 1 | P&L Statement | ✅ |
| 2 | Balance Sheet | ❌ Dashboard view only, not formal report |
| 3 | Cash Flow Statement | ✅ |
| 4 | A/R Aging | ✅ |
| 5 | A/P Aging | ❌ |
| 6 | Expense Report | ✅ |
| 7 | Tax Summary | ❌ 1099 exists but no full tax summary |
| 8 | Revenue by Client | ✅ |
| 9 | Revenue by Service/Product | ❌ |
| 10 | Expense by Vendor | ✅ Via 1099 + vendor management |
| 11 | Budget vs Actual | ✅ |
| 12 | Net Worth Statement | ❌ |

### Report Features (3/9)

| # | Feature | Status |
|---|---------|--------|
| 13 | Period selector | ✅ |
| 14 | Comparison toggle | ✅ |
| 15 | Scheduled reports (auto-email) | ❌ |
| 16 | Batch export (ZIP) | ❌ |
| 17 | Favorites / pinned | ❌ |
| 18 | Report templates | ❌ |
| 19 | Chart type toggle | ❌ |
| 20 | Drill-down to source data | ✅ |
| 21 | Print-optimized layouts | ✅ |

---

## 8. BANK SYNC (6/9 ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | CSV/OFX/QBO import | ✅ |
| 2 | Client-side parsing | ✅ |
| 3 | Smart field mapping | ✅ |
| 4 | Duplicate detection | ❌ |
| 5 | Reconciliation workflow | ✅ |
| 6 | Auto-categorization | ✅ |
| 7 | Manual category assignment | ✅ |
| 8 | Bulk actions | ❌ |
| 9 | Import history | ❌ |

---

## TOP 15 MISSING FEATURES (by impact)

| Priority | Feature | Module | Effort |
|----------|---------|--------|--------|
| 1 | Estimates/quotes → invoice conversion | Invoicing | MED |
| 2 | Auto payment reminders | Invoicing | MED (needs email service) |
| 3 | Invoice branding/logo + templates | Invoicing | LOW-MED |
| 4 | As-of date selector on balance sheet | Balance Sheet | LOW |
| 5 | Balance sheet as formal report | Reports | LOW (data exists) |
| 6 | AP aging report | Reports | MED (needs payables model) |
| 7 | Duplicate detection on bank import | Bank Sync | LOW |
| 8 | Net worth trend over time | Balance Sheet | LOW-MED |
| 9 | Depreciation schedules | Balance Sheet | MED |
| 10 | Drag-to-transfer between envelopes | Budget | LOW |
| 11 | Spending trend analysis by category | Budget | LOW-MED |
| 12 | Task/activity description on time entries | Time Tracker | LOW |
| 13 | Calendar-style timesheet view | Time Tracker | MED |
| 14 | Split transactions | Expense/Banking | MED |
| 15 | QuickBooks migration panel | Dashboard | MED |

---

## COMPLETION BY PRIORITY

**Strongest modules (>60%):**
- Expense Tracker: **75%** — closest to spec
- Bank Sync: **67%** — solid foundation
- Dashboard: **58%** — most features built
- Time Tracker: **58%** — core workflow done

**Needs work (40-60%):**
- Budget: **50%** — envelope core done, advanced features missing
- Reports: **48%** — 7 of 12 report types, features sparse

**Weakest (<40%):**
- Balance Sheet: **39%** — basic CRUD, missing accounting rigor
- Invoicing: **30%** — core works but most spec features missing

---

*Cross-referenced against SIMPL-MASTER-BUILD-SPEC.md (March 6, 2026)*
*Glass/theme items excluded per instruction*
*146 total spec features audited across 8 modules*

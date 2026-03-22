# SIMPL DEFINITIVE BUILD SPEC
## Every Missing Feature — Synthesized from Master Spec + Competitor Audit + Crossroads Matrix
### March 20, 2026

**Source documents merged:**
- `SIMPL-MASTER-BUILD-SPEC.md` (March 6 original vision — 146 features)
- `HELIX-COMPETITOR-AUDIT-2026-03-20.md` (160 features vs 30+ competitors)
- `SIMPL-SPEC-COMPLETION-AUDIT-2026-03-20.md` (current completion: 52%)
- `CROSSROADS-MATRIX.md` (130 drag-drop handlers)
- `HELIX-CASCADE-MATRIX-v58.md` (money chain + cascade functions)

**Goal:** 100% spec completion + competitor parity + Crossroads integration for every new feature

---

## BUILD SEQUENCE

Features grouped by module, ordered by dependency chain. Each feature includes:
- **What:** Exact behavior
- **Cascade:** How it connects to other modules via Crossroads/cascades
- **Competitor ref:** Who has this and what Helix does better

---

## PHASE 1: INVOICING (14 features — biggest gap)

Invoicing is at 30% spec completion. This is the money chain terminus — every improvement here directly impacts revenue collection.

### INV-1: Estimates/Quotes Mode
- Add `type` field to invoice: `'invoice'` | `'estimate'` | `'quote'`
- Separate numbering: `EST-001`, `QTE-001` using `financialSettings.estimatePrefix`
- Estimate statuses: `draft` → `sent` → `accepted` → `rejected` → `expired`
- **Cascade:** Accepted estimate → auto-create invoice (clone line items, link `estimateId`)
- **Crossroads:** `estimate-invoices` handler converts to invoice; `estimate-email` sends estimate
- **Competitor ref:** FreshBooks converts in 2 clicks, Square has multi-option estimates

### INV-2: Convert Estimate → Invoice
- One-click button on accepted estimates
- Copies all line items, client, tax, discount
- Links `invoice.estimateId` back to source
- Sets estimate status to `converted`
- Posts to AR on invoice creation
- **Cascade:** Triggers standard `updateBalanceSheetReceivables()`

### INV-3: Auto Payment Reminders
- `S.financialSettings.reminderSchedule`: array of day offsets `[-3, 0, 3, 7, 14]` (before/after due)
- `processPaymentReminders()` runs on app load
- Each reminder creates a task and opens `mailto:` with templated reminder email
- Track `inv.remindersSent[]` to avoid duplicates
- **Cascade:** Creates follow-up task linked to invoice and client
- **Competitor ref:** FreshBooks, QB, Wave all auto-send — this is the #1 feature that reduces DSO

### INV-4: Invoice Branding (Logo + Templates)
- `S.financialSettings.logo`: base64 data URL (captured same way as receipts)
- Logo appears on PDF export and portal preview
- 3 template styles: `'modern'` (default), `'classic'` (serif), `'minimal'` (no lines)
- Template selector in invoice form
- Color accent from `financialSettings.brandColor`
- **Competitor ref:** FreshBooks, Square, QB all have branding. Helix's V3OG aesthetic should shine here

### INV-5: Duplicate/Clone Invoice
- "Clone" button on invoice view → creates new draft with same line items, client, tax, discount
- New invoice number auto-incremented
- Clears payment history, resets status to draft
- **Cascade:** New invoice → AR auto-post

### INV-6: Credit Notes / Credit Memos
- New entity type on invoice: `type: 'credit-note'`
- Negative total, linked to original `invoice.creditForId`
- Applies as credit against future invoices for same client
- **Cascade:** Reverses AR by credit amount
- **Crossroads:** `invoice-invoices` handler could apply credit to another invoice

### INV-7: Batch Invoicing
- Multi-select clients from CRM → generate invoices from a template
- "Batch Invoice" button on invoices panel
- Select service/line items, apply to all selected clients
- Individual invoices created, each with own number
- **Cascade:** Each triggers AR auto-post

### INV-8: Deposit/Retainer Requests
- `inv.depositAmount` and `inv.depositDueDate` fields
- Deposit line appears on invoice above regular line items
- Partial payment auto-applies to deposit first
- Track deposit vs balance separately
- **Competitor ref:** Square Invoices, FreshBooks both support deposits

### INV-9: Multi-Currency Support
- `inv.currency` field (defaults to `financialSettings.currency`)
- Currency selector dropdown on invoice form (USD, EUR, GBP, CAD, AUD, etc.)
- `fmt$()` updated to respect per-invoice currency symbol
- Exchange rate field for reporting (optional)
- **Competitor ref:** Stripe supports 135+ currencies, Xero has full multi-currency

### INV-10: Expense Pass-Through
- "Add Expenses" button on invoice form
- Shows job-tagged expenses that haven't been invoiced
- Checkbox selection → adds as line items with markup option
- Marks expenses as `invoiced: true` with `invoiceId` link
- **Cascade:** Links expense → invoice → AR

### INV-11: Multiple Tax Rates
- Line-item level tax toggle (taxable yes/no)
- Support for 2 tax rates (e.g., state + local)
- `inv.taxRates: [{name:'State', rate:6.5}, {name:'Local', rate:1.5}]`
- Auto-calculate per-line and total

### INV-12: Client Portal (Hosted)
- `invoice.html` already exists — enhance with Stripe Checkout button
- Portal reads invoice data from Supabase (cloud) or URL-encoded token (offline)
- Client can view, download PDF, pay via Stripe
- Mark as `viewed` when portal is accessed (via Supabase function or token check)
- **Cascade:** Payment recorded → `updateBalanceSheetFromPayment()`

### INV-13: Discount Codes
- `S.discountCodes[]` with `code`, `type` (percent/flat), `value`, `expiresAt`, `usageLimit`
- Input field on invoice form to enter code
- Auto-applies discount, tracks usage count
- **Cascade:** Discount reduces invoice total → adjusts AR

### INV-14: Thank-You Email on Payment
- When `recordPayment()` marks invoice as `paid`, auto-open thank-you `mailto:`
- Templated: "Thank you for your payment of $X for Invoice #Y"
- Optional: create a follow-up task for relationship nurturing

---

## PHASE 2: BALANCE SHEET (9 features)

Balance sheet is at 39%. The accounting rigor features are what separate Helix from a toy.

### BAL-1: As-Of Date Selector
- Date picker on balance sheet overview
- Filter all calculations to transactions on or before selected date
- Show "As of [date]" label on hero
- **Competitor ref:** Table stakes for QB/Xero/Wave — bookkeepers need this for period closes

### BAL-2: Comparative Periods (Side-by-Side)
- Button: "Compare to prior period" or "Compare to prior year"
- Two-column layout: Current | Prior with $ change and % change columns
- Reuse `_reportPeriodDates()` logic for date ranges
- **Competitor ref:** QB "Balance Sheet Comparison" report

### BAL-3: Depreciation Schedules
- Per fixed asset: `depreciationMethod` (straight-line | declining-balance), `usefulLife` (years), `salvageValue`
- Auto-calculate monthly depreciation expense
- `processDepreciation()` runs on app load (monthly)
- Creates expense entry and reduces asset value
- **Cascade:** Depreciation expense → `updateBalanceSheetFromExpense()` → budget sync

### BAL-4: Net Worth Trend Over Time
- Use `S.financialSnapshots[]` (already captured monthly)
- Render SpendLine chart of `totalAssets - totalLiabilities` over all snapshots
- New sub-view on balance sheet: "Trend"
- **Competitor ref:** YNAB's Net Worth report is a major draw

### BAL-5: DSCR (Debt Service Coverage Ratio)
- Net Operating Income ÷ Total Debt Service
- Display in ratios view alongside current/quick/D-E ratios
- Color thresholds: >1.25 green, >1.0 amber, <1.0 red

### BAL-6: Working Capital Calculation
- Current Assets - Current Liabilities, displayed in ratios view
- Simple but missing — shows liquidity at a glance

### BAL-7: Days Payable/Receivable Outstanding
- DSO = (AR / Revenue) × Days in period
- DPO = (AP / Expenses) × Days in period
- Display in ratios view

### BAL-8: Notes Field Per Line Item
- Add `notes` field to balance sheet items
- Editable in `openBalanceSheetEditor()` modal
- Display as expandable row under item

### BAL-9: Balance Sheet as Formal Report
- Add to reports menu (9th report card)
- `renderReport_balanceSheet()` with period selector, CSV/PDF/clipboard export
- Reuse existing balance sheet data + render logic
- **Low effort — data and rendering already exist**

---

## PHASE 3: REPORTS (8 features)

Reports at 48%. Need 5 more report types + 3 platform features.

### RPT-1: A/P Aging Report
- Requires: bills/payables with vendor + due date (from budget bills or new payables model)
- Buckets: Current, 1-30, 31-60, 61-90, 90+
- Same drill-card pattern as AR aging
- **Competitor ref:** QB, Xero, Wave all have this

### RPT-2: Sales Tax Report
- Aggregate tax collected on paid invoices by period
- Show: gross revenue, taxable revenue, tax collected, tax rate(s)
- Quarterly breakdown for estimated payments
- **Competitor ref:** QB auto-calculates by agency, Wave tracks collected vs paid

### RPT-3: Revenue by Service/Product Report
- Group paid invoices by service/product line item description
- Show: total revenue, invoice count, average per invoice
- Bar chart visualization

### RPT-4: Net Worth Statement
- Assets - Liabilities over time using `financialSnapshots[]`
- Table + SpendLine trend chart
- Period selector (last 6mo, 1yr, all time)

### RPT-5: General Ledger / Trial Balance
- Unified view of all transactions grouped by account
- Each account shows total debits, total credits, net balance
- Trial balance: verify sum of debits = sum of credits
- **Competitor ref:** Core accounting report for QB/Xero/Wave

### RPT-6: Saved Report Configurations
- Per-report: save last-used period, filters, comparison mode to `S.savedReportConfigs`
- "Save" button on each report, auto-loads saved config on re-open
- **Low effort — just localStorage persistence**

### RPT-7: Favorites / Pinned Reports
- Star icon on report cards → pinned reports appear first in gallery
- `S.pinnedReports[]` array

### RPT-8: Chart Type Toggle
- On reports with charts: button to switch between bar/line/table views
- Use existing `renderIsometricBars`, `renderNeonTubeBars`, `renderBreathingBars`, `renderSpendLine`

---

## PHASE 4: BUDGET (7 features)

Budget at 50%. The YNAB-killer features are what make this a standalone selling point.

### BUD-1: Drag-to-Transfer Between Envelopes
- Hold envelope card → enters drag mode
- Drop on another envelope → prompt for transfer amount
- Updates both envelopes' `budgeted` amounts
- Visual: animated "pour" from source to target
- **Crossroads pattern:** Same hold-drag-drop as card routing

### BUD-2: Snowball Method Toggle
- Debt payoff view: toggle between Avalanche (highest rate first) and Snowball (lowest balance first)
- Show comparison: total interest paid each way, payoff date each way
- **Competitor ref:** YNAB shows both, lets user choose

### BUD-3: Savings Goal Target Dates
- Add `targetDate` field to savings goals
- Calculate required monthly contribution: `(target - current) / months remaining`
- Show projected completion date vs target
- Alert when off-track

### BUD-4: Spending Trend Analysis
- Per category: show last 3-6 months spending as SpendLine mini-chart
- "You spent X% more/less than your 3-month average"
- Surface anomalies: unusually high spend in a category
- **Competitor ref:** YNAB Spending Breakdown, Mint trends

### BUD-5: Budget Templates
- 5 starter templates: Freelancer, Small Business, Family, Debt Payoff, Bare Bones
- Each has pre-configured envelopes with suggested amounts
- "Start from template" button in budget creation
- **Competitor ref:** YNAB community templates

### BUD-6: "True Expenses" (Annual ÷ Monthly)
- Flag envelopes as `annual: true`
- Auto-divide annual amount by 12 for monthly budgeted
- Examples: insurance premiums, annual subscriptions, property tax
- **Competitor ref:** YNAB "True Expenses" — one of their signature features

### BUD-7: Projected End-of-Month Balance
- Calculate: current cash + expected income - committed expenses - remaining budget
- Display on budget overview as a forecast card
- Color: green if positive, red if projected negative

---

## PHASE 5: DASHBOARD (5 features)

Dashboard at 58%. Closing these gaps makes it a true command center.

### DASH-1: AP Aging Widget
- Mirror the AR aging widget but for payables/bills
- Requires RPT-1 (AP aging data model) to be built first
- Tap → drill to bills view

### DASH-2: Net Worth Widget
- Single card: Total Assets - Total Liabilities
- SpendLine mini-trend from snapshots
- Tap → drill to balance sheet

### DASH-3: Custom Date Range Selector
- Start/end date pickers on dashboard
- Replaces or supplements the week/month/quarter/year buttons
- All dashboard metrics recalculate for custom range

### DASH-4: Quick Data Entry
- FAB "+" button on dashboard → modal with two options: "Income" | "Expense"
- Minimal fields: amount, category/client, date
- Creates invoice (income) or expense (expense) in one tap
- **Cascade:** Income → AR post, Expense → cash reduction → budget sync

### DASH-5: Unbilled Time Widget
- Card showing total unbilled hours and dollar value
- Pull from `S.timeEntries` where `invoiced !== true`
- Tap → opens Time tab in invoices panel
- **Competitor ref:** FreshBooks prominently shows this

---

## PHASE 6: TIME TRACKER (5 features)

### TIME-1: Per-Entry Description Field
- Add text input for task/activity description when starting timer or logging manual time
- Stored as `entry.description`
- Shown in time entry lists and on invoices

### TIME-2: Multiple Hourly Rates
- Per-service rate tiers: `service.rates: [{name:'Standard', rate:75}, {name:'Rush', rate:125}]`
- Rate selector when starting timer
- Push to invoice uses selected rate

### TIME-3: Calendar-Style Timesheet
- Week view: 7 columns, rows are hours, blocks show time entries
- Color by client/project
- Tap block to edit entry
- Weekly total bar at bottom

### TIME-4: Utilization Tracking
- `billableHours / totalHours × 100` displayed as percentage
- Per week and per month
- Target line (e.g., 75% utilization goal)
- **Competitor ref:** Professional services firms live by this metric

### TIME-5: Project Budget Tracking
- `job.estimatedHours` field
- Progress bar: actual hours / estimated hours
- Alert when approaching 80% and 100% of budget
- Show on job view and time entries

---

## PHASE 7: EXPENSE TRACKER (5 features)

### EXP-1: Split Transactions
- "Split" button on expense → add multiple category allocations
- `exp.splits: [{category:'meals', amount:30}, {category:'supplies', amount:15}]`
- Total of splits must equal expense amount
- Each split syncs to its budget envelope
- **Competitor ref:** YNAB and QB both have this — daily usability feature

### EXP-2: Duplicate Detection
- On save: check for same vendor + amount + date within ±1 day
- Warning modal: "Similar expense exists — duplicate?"
- Option to merge or keep both

### EXP-3: Batch CSV Import to Expenses
- Direct CSV import to expenses (not just bank transactions)
- Column mapping: date, vendor, amount, category, description
- Preview before import
- **Reuse:** `parseCSVTransactions()` pattern

### EXP-4: Personal vs Business Toggle
- Toggle on expense form: `exp.personal: true/false`
- Filter in expense list: All / Business / Personal
- Personal expenses excluded from P&L and tax reports
- **Competitor ref:** Every accounting tool needs this separation

### EXP-5: Quick-Add Expense
- Minimal modal: amount + category only (vendor and date auto-fill)
- Accessible from dashboard FAB and expense panel header
- Full form available via "More details" expansion

---

## PHASE 8: BANK SYNC (3 features)

### BANK-1: Duplicate Detection on Import
- On CSV/OFX import: check each row against existing `S.bankTransactions`
- Match by: date + amount + description (fuzzy)
- Flag duplicates in preview, skip by default
- **Competitor ref:** QB auto-detects, Xero flags — most common import complaint

### BANK-2: Bulk Actions
- Multi-select checkboxes on transaction list
- Bulk categorize, bulk delete, bulk mark reconciled
- "Select All" / "Select None" buttons

### BANK-3: Import History Log
- `S.importHistory[]`: date, filename, row count, account, status
- View in banking settings
- Re-import protection (warn if same file imported before)

---

## CROSSROADS INTEGRATION MAP

New Crossroads handlers needed for new features:

| Source | Target | Handler | Action |
|--------|--------|---------|--------|
| `estimate` | `invoices` | `estimate-invoices` | Convert estimate → invoice |
| `estimate` | `email` | `estimate-email` | Send estimate to client |
| `estimate` | `crm` | `estimate-crm` | Go to client |
| `estimate` | `tasks` | `estimate-tasks` | Follow-up task |
| `credit-note` | `invoices` | `creditnote-invoices` | Apply credit to invoice |
| `expense` | `invoices` | `expense-invoices` | Pass-through to invoice line item |
| `time-entry` | `invoices` | `timeentry-invoices` | Push hours to invoice |
| `bank-txn` | `expenses` | `banktxn-expenses` | Create expense (exists, formalize) |
| `bill` | `expenses` | `bill-expenses` | Pay bill → create expense |
| `receipt` | `bank-txn` | `receipt-banktxn` | Match receipt to transaction |

---

## CASCADE CHAIN ADDITIONS

```
ESTIMATE → (accepted) → INVOICE → AR post → TASK (follow-up)
DEPRECIATION → (monthly) → EXPENSE → cash reduction → budget sync
RECURRING EXPENSE → (on schedule) → EXPENSE → cash reduction → budget sync
PAYMENT REMINDER → (on schedule) → TASK + EMAIL
BILL → (paid) → EXPENSE → cash reduction → budget sync → AP reduction
```

---

## TOTAL FEATURE COUNT

| Phase | Module | Features | Priority |
|-------|--------|----------|----------|
| 1 | Invoicing | 14 | CRITICAL — money chain |
| 2 | Balance Sheet | 9 | HIGH — accounting rigor |
| 3 | Reports | 8 | HIGH — completeness |
| 4 | Budget | 7 | HIGH — YNAB killer |
| 5 | Dashboard | 5 | MEDIUM — command center |
| 6 | Time Tracker | 5 | MEDIUM — service businesses |
| 7 | Expense Tracker | 5 | MEDIUM — daily usability |
| 8 | Bank Sync | 3 | MEDIUM — data integrity |
| **TOTAL** | | **56 features** | |

**Current: 76/146 built (52%)**
**After this build: 132/146 (90%)+ with competitor features exceeding spec**

---

## SUCCESS CRITERIA

When this build is complete:
1. Every checkbox from the master build spec is ✅
2. Competitor parity achieved with QuickBooks, FreshBooks, YNAB, Xero on core features
3. Budget module exceeds QB (which has weak budgeting)
4. Banking integration ties field CRM → back office into one seamless platform
5. Crossroads handlers exist for every new entity type
6. Cascade chains fire correctly for every financial event
7. All new features work offline-first with `save()` to localStorage

---

*"Every number has a story. Every trend has motion. Pay once. Own forever."*

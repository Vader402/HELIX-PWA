# HELIX MODULE FEATURE AUDIT vs. COMPETITORS
## Full 8-Module, 160-Feature Competitive Analysis
### March 20, 2026

---

## SCOREBOARD

| Module | ✅ Has | 🔶 Partial | ❌ Missing | Total | Grade |
|--------|--------|-----------|-----------|-------|-------|
| **Dashboard** | 13 | 3 | 4 | 20 | **A-** |
| **Banking** | 12 | 2 | 6 | 20 | **B+** |
| **Budget** | 10 | 5 | 5 | 20 | **B** |
| **Balance Sheet** | 8 | 3 | 9 | 20 | **C+** |
| **Reports** | 8 | 4 | 8 | 20 | **C+** |
| **Invoicing** | 11 | 4 | 5 | 20 | **B+** |
| **Booking** | 8 | 2 | 10 | 20 | **C** |
| **CRM** | 10 | 4 | 6 | 20 | **B** |
| **TOTALS** | **80** | **27** | **53** | **160** | **B-** |

**Overall: 80 solid + 27 partial = 107/160 features present (67%)**

---

## MODULE 1: DASHBOARD
**Competitors: QuickBooks, Wave, FreshBooks, Xero**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Cash-on-hand hero metric | ✅ | 48px animated hero with glow, pulled from balance sheet |
| 2 | Revenue / Expenses / Profit summary cards | ✅ | 2x2 grid with margin %, drill-to-detail |
| 3 | Cash flow trend chart | ✅ | SVG spend-line, adapts to week/month/quarter/year |
| 4 | Period selector (week/month/quarter/year) | ✅ | 4-button compact bar |
| 5 | Business health score | ✅ | Composite 0-100, 6 weighted factors, SVG ring gauge — **unique to Helix** |
| 6 | Invoice aging (AR aging) | ✅ | 5-bucket with stacked color bar and drill |
| 7 | Overdue invoice alerts | ✅ | Red/amber banners with count and click-through |
| 8 | Low runway / burn rate warnings | ✅ | Conditional alerts at <2 and <4 months |
| 9 | Expense breakdown by category | ✅ | Horizontal bars + isometric 3D chart |
| 10 | Top clients by revenue | ✅ | Ranked list with drill-to-client financial profile |
| 11 | Cash forecast (30/60/90 day) | 🔶 | Exists but linear burn only — no pending invoices/recurring bills factored in (QB uses AI) |
| 12 | Accounts payable / aged payables | 🔶 | Bill tracking exists but no formal AP aging like Xero |
| 13 | Period-over-period comparison on dashboard | ❌ | QB/Xero/FreshBooks show MoM/YoY inline — Helix has it as a separate report only |
| 14 | Customizable / rearrangeable widgets | ❌ | Hard-coded layout — Xero has drag-and-drop widget customization |
| 15 | Sales tax tracking / tax liability summary | ❌ | Tax rate applied to P&L but no collected-vs-owed dashboard widget |
| 16 | Bank account balances on dashboard | ✅ | Shown in cashflow sub-view |
| 17 | Unbilled time on dashboard | ❌ | Timer exists but unbilled hours total never surfaces on dashboard (FreshBooks shows this) |
| 18 | Receipt capture linked to expenses | ✅ | Camera capture with base64 storage, multi-receipt support |
| 19 | Quick actions panel | ✅ | 2x2 grid: New Invoice, Log Expense, Banking, Reports |
| 20 | P&L accessible from dashboard | 🔶 | Revenue/expenses/profit shown but no structured P&L with COGS/gross profit drill |

---

## MODULE 2: BANKING
**Competitors: QuickBooks, Xero, Wave, FreshBooks**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Automatic bank feed via Plaid | ✅ | Full Plaid Link flow via Supabase edge functions |
| 2 | Manual account creation (4 types) | ✅ | Checking, savings, credit, cash |
| 3 | Manual transaction entry | ✅ | Debit/credit/transfer/refund with date, category, account |
| 4 | CSV / OFX / QFX / QBO file import | ✅ | Auto-detect columns, preview before import |
| 5 | Transaction categorization (manual) | ✅ | Full EXPENSE_CATEGORIES picker per transaction |
| 6 | Auto-categorization rules engine | ✅ | Learns from manual tags, bulk apply, rules manager with hit counts |
| 7 | Statement reconciliation wizard | ✅ | Statement balance, checkbox selection, difference calc, finalize + history |
| 8 | Transaction-to-entity matching | ✅ | Match to invoices and jobs with partial balance tracking |
| 9 | Transaction search and filtering | ✅ | Search bar, income/expense/unmatched filters, date range |
| 10 | Reconciliation status indicators | ✅ | Green/amber dots per transaction |
| 11 | Account drill-down with in/out summary | ✅ | Balance, total in, total out, SpendLine chart |
| 12 | Create expense from bank transaction | ✅ | One-click with auto-fill, auto-expense toggle on rules |
| 13 | Split transactions across categories | ❌ | QB splits by amount/%, Xero splits during reconciliation |
| 14 | Duplicate transaction detection | ❌ | No dedup on import/sync — QB auto-detects, Xero flags |
| 15 | Automatic transfer matching between accounts | ❌ | Transfer type exists but no cross-account pairing |
| 16 | Multi-currency / FX support | ❌ | USD-only throughout |
| 17 | Bulk reconciliation / cash coding | 🔶 | Multi-select for reconcile, but no Xero-style grid categorization |
| 18 | Receipt attachment on transactions | 🔶 | Receipt module exists in expenses but not linked to bank txns directly |
| 19 | Exclude / hide transactions | ❌ | No exclude mechanism — QB has explicit "Exclude" action |
| 20 | AI-powered auto-matching / suggestions | ❌ | Manual matching only — QB AI and Xero JAX auto-suggest |

---

## MODULE 3: BUDGET
**Competitors: YNAB, Mint/Credit Karma, QuickBooks, Wave**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Zero-based / envelope budgeting | ✅ | Core architecture matches YNAB's model |
| 2 | Bank account sync (Plaid) | ✅ | Full Plaid integration via edge functions |
| 3 | Budget vs actual reporting | ✅ | Dedicated report with variance, %, CSV/PDF export |
| 4 | Recurring bill tracking | ✅ | Bills with dueDay, overdue detection, paid toggle |
| 5 | Savings goals with progress | ✅ | Name/target/current with visual progress bars |
| 6 | Debt payoff tracker | ✅ | Avalanche method, interest calc, payoff date estimation |
| 7 | Monthly rollover | ✅ | Auto-detects new month, carries surplus, archives snapshot |
| 8 | Overspending alerts | ✅ | Toast alerts at 80% and 100% thresholds |
| 9 | Envelope drill-down with transaction list | ✅ | Matches expenses by category, shows individual items |
| 10 | Cash flow forecast | ✅ | 30/60/90 day bars based on burn rate |
| 11 | Multi-month budget history browsing | 🔶 | Snapshots stored but no UI to browse past months (YNAB navigates any month) |
| 12 | Category auto-assignment from transactions | 🔶 | Basic string match — no ML like YNAB/Mint |
| 13 | Split transactions across categories | ❌ | YNAB allows splitting a single receipt across envelopes |
| 14 | Budget templates / presets | 🔶 | One hardcoded template — YNAB has dozens of community templates |
| 15 | Multi-budget / department budgets | ❌ | Only `S.budgets[0]` — QB supports by Class/Location |
| 16 | Scheduled recurring transactions | 🔶 | Bills tracked but no auto-expense creation on due date |
| 17 | Net worth tracking over time | ❌ | No time-series net worth chart (YNAB has dedicated report) |
| 18 | Budget period flexibility (weekly/quarterly/annual) | 🔶 | `period` field exists but UI is monthly-only |
| 19 | Multi-user / shared budget | ❌ | Single-user only — YNAB supports partner budgets |
| 20 | Spending trend analytics | ❌ | Current-month bars only — no "you spent 20% more" insights |

---

## MODULE 4: BALANCE SHEET
**Competitors: QuickBooks, Xero, Wave, FreshBooks**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Standard A = L + E structure | ✅ | Assets (current/fixed), Liabilities (current/long-term), Equity |
| 2 | "As of" date selector | ❌ | Always shows live state — QB/Xero let you pick any past date |
| 3 | Comparative / period-over-period view | ❌ | No side-by-side dates — QB has "Balance Sheet Comparison" |
| 4 | Accrual vs cash basis toggle | ❌ | Hybrid calculation — no toggle (table stakes for QB/Xero) |
| 5 | Export to PDF | 🔶 | PDF infra exists but not wired to balance sheet views |
| 6 | Export to CSV / Excel | 🔶 | CSV function exists but not connected to balance sheet |
| 7 | Retained earnings auto-calculation | ✅ | `enforceBalanceSheet()` computes revenue - expenses into equity |
| 8 | Balance equation enforcement | ✅ | Auto-creates "Balancing Adjustment" equity entry + warning banner |
| 9 | Current Ratio | ✅ | Current Assets / Current Liabilities with color thresholds |
| 10 | Quick Ratio (Acid Test) | 🔶 | Uses Cash only — should include AR and marketable securities |
| 11 | Debt-to-Equity Ratio | ✅ | Correctly implemented with color thresholds |
| 12 | CRUD for line items | ✅ | Full add/edit/delete modal for all sections |
| 13 | Period snapshots / audit trail | ✅ | Monthly auto-capture with full BS detail, displayed in detail view |
| 14 | Chart of Accounts integration | ❌ | Free-text name/amount pairs — no structured COA |
| 15 | Drill-down to underlying transactions | ❌ | Click opens editor, not transaction list (QB drills to journal entries) |
| 16 | Multi-currency support | ❌ | USD-only |
| 17 | Depreciation / amortization tracking | ❌ | Fixed assets are static amounts — no schedules |
| 18 | Sub-account / sub-category hierarchy | ❌ | Flat list — no nesting like QB/Xero |
| 19 | Visual charts on overview | ✅ | Isometric and breathing bar charts, toggleable |
| 20 | Scheduled / automated report delivery | ❌ | No email scheduling — QB does daily/weekly/monthly |

---

## MODULE 5: REPORTS
**Competitors: QuickBooks (65-100+), Xero (~50), FreshBooks (~7), Wave (~12)**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Profit & Loss (Income Statement) | ✅ | Period selectors, prior-period %, expense categories, NeonTube chart |
| 2 | Cash Flow Statement | ✅ | Operating/Investing/Financing, proper 3-section format |
| 3 | Balance Sheet report | 🔶 | Exists as dashboard view but NOT in the 8 reports menu, no CSV/PDF |
| 4 | Expense Report | ✅ | Categorized, date ranges, isometric charts, reimbursable flag |
| 5 | Invoice / AR Aging | ✅ | 5 buckets, per-invoice detail, breathing bar chart |
| 6 | Accounts Payable (AP) Aging | ❌ | No bills/payables data model with due dates |
| 7 | Client Revenue / Income by Customer | ✅ | Revenue, paid, outstanding, LTV per client — LTV is unique |
| 8 | Budget vs Actual | ✅ | Envelope variance with % and chart |
| 9 | Period Comparison (MoM/QoQ/YoY) | ✅ | 3 modes, side-by-side table, NeonTube charts, trend insights |
| 10 | 1099 Contractor Summary | ✅ | Year selector, $600 threshold flagging — **unique vs FreshBooks/Wave/Xero** |
| 11 | Sales Tax Report | ❌ | Flat rate estimate only — no collected-vs-owed tracking |
| 12 | Trial Balance | ❌ | Not present — QB/Xero/Wave all have it |
| 13 | General Ledger / Account Transactions | ❌ | No unified ledger view — core accounting report |
| 14 | Tax Summary / Quarterly Estimates | 🔶 | Tax Overview exists as vault sub-view but lacks Schedule C lines |
| 15 | Report Export: CSV + PDF + Clipboard | ✅ | All 8 reports have all 3 export options — clipboard copy is unique |
| 16 | Scheduled / Emailed Reports | ❌ | No automation — QB schedules daily/weekly/monthly |
| 17 | Custom Report Builder | ❌ | Fixed-format only — QB Advanced has drag-and-drop builder |
| 18 | Saved / Memorized Reports | ❌ | No saved configs — QB allows memorizing filters |
| 19 | Multi-period Financial Statements | 🔶 | Period Comparison covers this for trends, but P&L is single-period |
| 20 | Vendor / Purchases Summary | 🔶 | 1099 shows vendor totals but only in tax context, not standalone |

---

## MODULE 6: INVOICING
**Competitors: FreshBooks, Square, Stripe, QuickBooks, Wave**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Invoice creation with line items | ✅ | Description, qty, rate per line; subtotal/total auto-calc |
| 2 | Recurring / subscription invoices | ✅ | Weekly/biweekly/monthly/quarterly with auto-generate on load |
| 3 | Tax calculation | ✅ | Per-invoice tax rate with `financialSettings.taxRate` default |
| 4 | Discount support | ✅ | Percent-based discount with live preview |
| 5 | PDF export / print | 🔶 | Browser print-to-PDF, not a generated file attachment (FreshBooks/QB generate PDFs) |
| 6 | Email sending | 🔶 | `mailto:` only — FreshBooks/QB send from servers with delivery tracking |
| 7 | Client portal (view & pay) | ✅ | Portal preview with line items, progress bar, Stripe pay button |
| 8 | Online payment (Stripe Checkout) | ✅ | Edge function for Checkout Sessions + payment link fallback |
| 9 | Partial payments & payment tracking | ✅ | Per-payment records with date/method/note, progress bar |
| 10 | Late fee auto-calculation | ✅ | Monthly percentage-based, configurable rate |
| 11 | Void & write-off | ✅ | Void reverses AR; write-off via Crossroads drag |
| 12 | AR auto-posting / accounting integration | ✅ | Double-entry style: AR tracks with balance sheet in real time |
| 13 | Overdue auto-detection & status lifecycle | ✅ | 8-status chain: draft→sent→viewed→partial→paid→overdue→void→written-off |
| 14 | Estimates / quotes that convert to invoice | ❌ | No estimate entity — FreshBooks converts in 2 clicks |
| 15 | Invoice branding / customizable templates | 🔶 | Business name only — no logo, colors, or template layouts |
| 16 | Multi-currency support | 🔶 | Single global currency — no per-invoice currency switching |
| 17 | Automated payment reminders | ❌ | Creates manual task only — all competitors auto-send emails |
| 18 | Deposit / retainer requests | ❌ | No deposit field — Square allows upfront deposit with split due date |
| 19 | Batch / bulk invoicing | ❌ | One at a time only — Square Plus and QB offer batch |
| 20 | Credit notes / credit memos | ❌ | No credit note entity — needed for refunds/adjustments |

---

## MODULE 7: BOOKING
**Competitors: Calendly, Acuity, Cal.com, SimplyBook.me, Setmore**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Public booking page with shareable link | ✅ | Slug-based, Supabase-backed, XSS-escaped |
| 2 | Service-based booking (multiple types) | ✅ | Per-service duration, selector when >1 service |
| 3 | Per-service availability (days + hours) | ✅ | `availDays`, `availStart`, `availEnd` per service |
| 4 | Double-booking prevention | ✅ | Re-checks before insert, blocks against calendar events |
| 5 | Buffer time between appointments | 🔶 | Hard-coded 15 min — not configurable per service (Calendly/Acuity are) |
| 6 | Booking status workflow | ✅ | Pending/confirmed/completed/cancelled with chips |
| 7 | Admin booking management (CRUD) | ✅ | Full modal with card+wheel pattern, cascades to job/invoice/task |
| 8 | Calendar integration | ✅ | Bookings render on day/week/month with cyan dots and pulse |
| 9 | Timezone-aware booking picker | ❌ | No timezone handling — Calendly auto-detects booker timezone |
| 10 | Automated email confirmations & reminders | ❌ | Success page promises email but none is sent |
| 11 | Client self-reschedule / self-cancel | ❌ | `rescheduleBooking()` opens admin modal, not client-facing |
| 12 | Intake / custom questions on form | ❌ | Only name/email/phone/notes — no custom question builder |
| 13 | Lead time / minimum notice | ❌ | Only guard is "today or future" — no hours/days minimum |
| 14 | Maximum advance booking window | ❌ | Date input is unbounded — Calendly caps at rolling window |
| 15 | Daily booking limits | ❌ | No per-day cap logic |
| 16 | Group / class booking | ❌ | One-to-one only — Acuity/SimplyBook have multi-attendee |
| 17 | Add-on services during booking | ❌ | Single service only — Acuity allows extras |
| 18 | Payment collection at booking | ❌ | No payment on public page — Acuity integrates Stripe at booking |
| 19 | Embeddable booking widget | ❌ | Standalone page only — Calendly has inline/popup embeds |
| 20 | Booking analytics / reporting | 🔶 | 3 stat counters only — no conversion rates, no-show tracking, trends |

**⚠ NOTE:** The roadmap (`project_booking_roadmap.md`) claims Tier 1, 1+, and MED features as "DONE" but many were not found in the current working copy. May be a version/branch issue — verify against the last pushed version.

---

## MODULE 8: CRM
**Competitors: Pipedrive, Close, HubSpot Free, Jobber, HoneyBook**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Contact & company management | ✅ | 3-tab CRM: Prospects, Contacts, Personals with full CRUD |
| 2 | Visual pipeline with stages | ✅ | Lead→Contacted→Sample→Negotiating→Closed→Dead with filter pills |
| 3 | Deal value & weighted pipeline forecasting | ❌ | No dollar amounts on prospects — Pipedrive/Close forecast revenue |
| 4 | Activity timeline per contact | ✅ | Aggregates events, tasks, notes, emails, status changes |
| 5 | Email compose & send | ✅ | In-app composer, quick-email actions on every card |
| 6 | Email templates | ✅ | Full matrix: Type x Product x Tone with merge fields |
| 7 | Email tracking (open/reply) | 🔶 | Manual status buttons — no auto-detection (Pipedrive/Close auto-track) |
| 8 | Email sequences / multi-step cadences | ❌ | Close has multi-channel sequences — Helix has zero automation |
| 9 | Built-in calling / power dialer | ❌ | `tel:` link only — Close has VoIP, power dialer, call recording |
| 10 | Task management linked to CRM | ✅ | Quick-task from prospects, filter by prospect, timeline integration |
| 11 | Scheduling & calendar integration | ✅ | `scheduleProspect()`, booking module, availability sharing |
| 12 | Follow-up reminders & overdue alerts | ✅ | Follow-up dates, overdue filter, red glow indicators |
| 13 | Custom fields | ✅ | User-defined name/value pairs with add/delete UI |
| 14 | Notes system linked to contacts | ✅ | Rich notes with types (meeting/call/follow-up), filterable |
| 15 | Workflow automation / triggers | ❌ | No if-then rules — Pipedrive/HoneyBook have workflow builders |
| 16 | Proposals, quotes & e-signatures | 🔶 | Invoice system is strong but no proposal builder or e-signature capture |
| 17 | Web forms / lead capture | ❌ | No embeddable forms — Pipedrive/HubSpot have lead capture |
| 18 | Reporting & sales analytics | 🔶 | Client Revenue report with LTV, but no pipeline conversion/win-loss/velocity |
| 19 | Mobile-first / offline PWA | ✅ | Full PWA with localStorage, offline queue — **unique advantage** |
| 20 | Multi-user / team assignment | 🔶 | Assign-to fields exist but no RBAC, no team dashboards |

---

## TOP 10 GAPS TO CLOSE (Across All Modules)

| Priority | Feature | Module | Impact | Effort |
|----------|---------|--------|--------|--------|
| 1 | **Automated payment reminders** | Invoicing | Cuts DSO, all competitors have it | MED (needs email service) |
| 2 | **Estimates/quotes → invoice** | Invoicing | Table stakes for service businesses | MED |
| 3 | **Timezone-aware booking** | Booking | Broken UX for remote clients | LOW |
| 4 | **Email confirmations & reminders** | Booking | Promised but not delivered | MED (needs email service) |
| 5 | **Deal values & pipeline forecasting** | CRM | Can't prioritize without $ amounts | LOW |
| 6 | **Period-over-period on dashboard** | Dashboard | "Am I doing better?" — basic question | LOW (data exists) |
| 7 | **Balance Sheet as formal report** | Reports | Data exists, just needs report renderer | LOW |
| 8 | **Sales Tax report** | Reports | Required for any tax-collecting business | MED |
| 9 | **Duplicate transaction detection** | Banking | Most common import frustration | LOW |
| 10 | **Split transactions** | Banking/Budget | Daily usability for multi-category purchases | MED |

## WHERE HELIX WINS (Unique Advantages)

- **Business Health Score** — No competitor has a composite weighted score with factor analysis
- **Crossroads drag-to-assign UX** — Unique interaction pattern
- **Offline-first PWA** — True field sales tool, works without internet
- **V3OG dark aesthetic** — Dramatically more engaging than flat competitor UIs
- **Drill stack architecture** — Infinite-depth drill panes beat any competitor's click-through
- **Email template matrix** — Type x Product x Tone is unique to field sales
- **1099 Contractor Summary** — Only Helix and QB have this
- **Activity feed scroll-snap wheel** — Unique touch-first interaction
- **Unified animation system** — No competitor matches the visual polish

---

*Generated by Claude Code agent audit — 8 parallel research agents, 160 features across 30+ competitors*
*Sources: QuickBooks, Xero, Wave, FreshBooks, YNAB, Mint/Credit Karma, Calendly, Acuity, Cal.com, SimplyBook.me, Setmore, Pipedrive, Close, HubSpot, Jobber, HoneyBook, Square, Stripe*

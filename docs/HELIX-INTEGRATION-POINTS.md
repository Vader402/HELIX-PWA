# HELIX ↔ SIMPL INTEGRATION AUDIT
## Complete Mapping for 9-Module Financial Suite Integration
**Generated:** 2026-03-18 | **Helix:** v85+ (index.html, ~38k lines) | **SIMPL:** mod-PACKED-S15 (19,436 lines) + HELIX-MODULES-V1 (8 modules, 6,359 lines)

---

# SECTION 1: CASCADE FUNCTIONS

## Cascade Function Registry

| Function | Line | Trigger | Creates/Updates | Downstream |
|----------|------|---------|-----------------|------------|
| cascadeFromProspect() | 19973 | Prospect save | Task (follow-up) | Task renders in missions |
| cascadeBookingFromProspect() | 20000 | Prospect action | Booking | Opens booking panel |
| cascadeFromEvent() | 15543 | Event cascade btn | Task + Note | Task in missions; Note if meeting |
| cascadeFromTask() | 21686 | Task cascade btn | Calendar Event | Event in schedule |
| cascadeNoteFromTask() | 21705 | Task cascade btn | Note | Note panel, linked to task |
| cascadeFromProduct() | 22225 | Product save | Booking (pending) | Product linked to booking |
| cascadeFromService() | 22787 | Service save | (available for job/booking) | — |
| cascadeFromJob() | 24184 | Job cascade btn | Calls generateInvoiceFromJob() | Invoice generation |
| generateInvoiceFromJob() | 24194 | Job complete OR cascade | Invoice (draft) + job→'invoiced' | Opens invoices panel |
| cascadeFromInvoice() | 24873 | Invoice cascade btn | Task (follow-up) | Closes invoice; renders tasks |
| cascadeFromBooking() | 25780 | Booking cascade btn | Job (pending) + Event | Job+event cross-linked |
| cascadeInvoiceFromBooking() | 25828 | Booking invoice btn | Invoice (draft) | Links to booking |
| cascadeTaskFromBooking() | 25861 | Booking prep btn | Task (prep) 1 day before | Linked to booking |
| cascadeFromContact() | 26172 | Contact save | (available for linking) | — |
| cascadeFromNote() | 29636 | Note cascade btn | Varies by type: Task/Event/Email/Prospect | Conditional |
| updateNoteCascade() | 29598 | Note type change | Updates cascade btn visibility | Dynamic show/hide |

## Cascade Flow Diagrams

```
PRIMARY MONEY FLOW:
Service → Booking → Job → Invoice → [Payment - NOT YET]
              ↓         ↓        ↓
           Event    TimeEntry  Follow-up Task

PROSPECT FLOW:
Prospect → Task (follow-up)
        → Booking → (enters money flow above)
        → Event
        → Email

NOTE FLOW:
Note → Task | Event | Email | Prospect (type-dependent)

CROSSROADS ALTERNATIVE PATH:
Any Card → Long-press → Drag to HUD → Same cascade functions
```

## Cascade Data Structures

**generateInvoiceFromJob() creates:**
```javascript
{ id, number: '001', clientId: job.clientId, jobId: job.id,
  serviceId: job.serviceId, bookingId: job.bookingId,
  items: [{ description, qty, rate, total }],
  status: 'draft', dueDate: now + 15 days }
```

**cascadeFromBooking() creates Job + Event:**
```javascript
Job:   { id, title, clientId, serviceId, status:'pending', bookingId, totalSeconds:0, timeEntries:[] }
Event: { id, date, time, type:'booking', bookingId, jobId }
```

---

# SECTION 2: CROSSROADS HANDLERS

## HUD Button Map

| Button ID | Layer | Panel | Color |
|-----------|-------|-------|-------|
| bCRM | L1 | crm | cyan |
| bNotes | L1 | notes | red |
| bMis | L1 | missions | purple |
| bEml | L1 | email | green |
| ring | L1 | schedule | amber |
| bServices | L2 | services | green |
| bJobs | L2 | jobs | blue |
| bInvoices | L2 | invoices | gold |
| bContacts | L2 | contacts | pink |
| bBanking | L2 | banking | green (hidden until unlocked) |

## Sub-Destination Map (Key Financial Routes)

| Combo | Actions |
|-------|---------|
| job-invoices | generateInvoice |
| booking-jobs | linkJob |
| invoice-tasks | followUp |
| invoice-crm | linkProspect |
| invoice-email | emailAbout |
| invoice-jobs | linkJob |
| prospect-bookings | createBooking |
| event-bookings | convertBooking |
| note-crm | linkProspect, newProspect, addHistory |
| task-crm | linkProspect, logActivity, addContext |

## Crossroads Mechanics

- **Activation:** 350ms long-press on any card
- **Detection radius:** 120px (160px for ring/schedule)
- **Lock radius:** 80px → auto-confirms drop
- **Layer switching:** Hold at screen edge 30px for 400ms
- **Disabled combos:** Self-to-self (prospect→crm, task→tasks, etc.)

## Financial Handler Examples

```javascript
'job-invoices/generateInvoice': (data) => generateInvoiceFromJob(data.sourceData.id)
'invoice-tasks/followUp': (data) => { create task linked to invoice }
'booking-jobs/linkJob': (data) => { open jobs panel }
```

---

# SECTION 3: MODAL FUNCTIONS

## Modal Inventory

| Modal ID | Open Function | Data Required | Line |
|----------|---------------|---------------|------|
| evtModal | openQuickEventModal() / card editor | evtId, evtDate, evtHour | 9228 |
| noteModal | openNoteModal(prospectId?) | prospectId (optional) | 10664 |
| taskModal | openTaskModal(id) | task id (edit) | 11181 |
| jobModal | openJobModal(id) | job id (edit) | 10204 |
| invoiceModal | openInvoiceModal(id) | invoice id (edit) | 10431 |
| prospectModal | openProspectModal(id) | prospect id (edit) | 12090 |
| bookingModal | openBookingModal() | — | 11881 |
| contactModal | openContactModal() | — | 11743 |
| productModal | openProductModal() | — | 11403 |
| serviceModal | openServiceModal() | — | 11523 |
| outreachModal | (outreach form) | window.outreachSelectedId | 11678 |
| cliqueModal | openCliqueModal(id) | clique id | Dynamic (31824) |
| placeModal | openPlaceModal(id) | place id | Dynamic (32323) |
| funcModal | openFunctionModal(id) | function id | Dynamic (32754) |
| dateModal | openDateModal(id) | date id | Dynamic (33410) |
| questModal | openQuestModal(id) | quest id | Dynamic (33964) |

## Modal Patterns

**Open:** `openXxxModal(id)` → lookup from `S.xxx`, populate fields, show
**Close:** `closeXxxModal()` → hide, cleanup voice capture
**Save:** Tap card preview OR save button → `saveXxx()` → `save(entityType, id, 'upsert')`
**Cascade:** After save, cascade row appears with contextual actions

## Card Becomes Draggable at SAVE Field

| Card | Save Field Index | Line |
|------|-----------------|------|
| noteCard | 6 | 29453 |
| taskCard | 7 | 14469 |
| prospectCard | 7 | 19813 |
| jobCard | 5 | 22340 |
| invoiceCard | 6 | 23855 |

---

# SECTION 4: DRAG AND DROP

## Crossroads Drag System (Complete)

| Element | Trigger | Drop Target | Result | Line |
|---------|---------|-------------|--------|------|
| Any panel card | 350ms hold | HUD orbital buttons | depositCard() → handler | 38088 |
| Note card (save-ready) | Card touch at field 6 | HUD buttons | saveNote() then crossroads | 29456 |
| Outreach card | 350ms hold | HUD buttons | Creates prospect, crossroads | 27630 |
| Personal cards (5 types) | 350ms hold | HUD buttons | startCrossroadsFromModal() | 32592+ |
| Queue cards | 350ms hold | Modal save OR orbital | saveQueueCardHere() or crossroads | 31490 |

## Drag State

| Variable | Purpose |
|----------|---------|
| isDragging | Currently in drag motion |
| isFloating | Parked in corner (can resume) |
| activeBtn | Hovered button ID |
| isLocked | Within lock radius |
| cardData | {type, id, title, meta, status, sourceType, sourceData} |
| layer | Active HUD layer (1 or 2) |

---

# SECTION 5: BUSINESS SUITE STRUCTURE

## Panels

| Panel ID | Purpose | Render Function | Layer | Line |
|----------|---------|-----------------|-------|------|
| panel-schedule | Calendar | renderSchedule() | 1 | 9501 |
| panel-crm | CRM prospects | renderCRM() | 1 | 9668 |
| panel-notes | Notes capture | renderNotes() | 1 | 10003 |
| panel-missions | Tasks/missions | renderMissions() | 1 | 9777 |
| panel-email | Email outreach | renderEmail() | 1 | 9854 |
| panel-products | Product inventory | renderProducts() | 2 | 10843 |
| panel-services | Service config | renderServices() | 2 | 10880 |
| panel-bookings | Booking mgmt | renderBookings() | 2 | 10917 |
| panel-jobs | Job tracking | renderJobs() | 2 | 10113 |
| panel-invoices | Invoice mgmt | renderInvoices() | 2 | 10164 |
| panel-contacts | Little Black Book | renderContacts() | 2 | 10957 |
| panel-banking | Bank connection | renderBanking() | 2 | 11158 |

## openPanel() (Line 16453)

Routes panel name → renders content, handles tab state, shows/hides FABs.

---

# SECTION 6: DATA ENTITIES & LOCALSTORAGE

## State Object (S) — Key `'scV12'`

```javascript
S = {
  events:[], prospects:[], tasks:[], notes:[],           // Core 5
  products:[], services:[], bookings:[], jobs:[],        // SIMPL
  invoices:[], contacts:[],                              // SIMPL
  timeEntries:[],                                        // Time tracking
  cliques:[], places:[], functions:[], dates:[], quests:[], // Personals
  connections:[], discoveries:[], checkins:[],            // Personals
  invites:[], hangouts:[], trips:[],                     // Personals
  groupChallenges:[], accountability:[],                 // Personals
  availability:{}, paymentSettings:{}, bookingSettings:{}, bookingSlug:''
}
```

## SYNC_ENTITIES (Line 13247)

```
prospects, events, tasks, notes, products, orders, services, timeEntries,
invoices, jobs, bookings, contacts, cliques, connections, places,
discoveries, checkins, functions, invites, hangouts, trips, dates,
quests, groupChallenges, accountability
```

## save() Function (Line 12625)

```javascript
save(entityType?, entityId?, action?)
// 1. Stamps _updatedAt on entity
// 2. Persists S to localStorage['scV12']
// 3. Appends to helix_pending[] for cloud sync
```

## Entity Relationships

```
Contact ──hasMany──→ Bookings (clientId)
Contact ──hasMany──→ Invoices (clientId)
Service ──hasMany──→ Bookings (serviceId)
Service ──hasMany──→ Jobs (serviceId)
Booking ──hasOne───→ Job (bookingId on job)
Job     ──hasOne───→ Invoice (jobId on invoice)
Job     ──hasMany──→ TimeEntries (in job.timeEntries[])
Invoice ──belongsTo→ Job, Service, Booking (via IDs)
```

---

# SECTION 7: EVENT SYSTEM

| Event | Trigger | Listener | Line |
|-------|---------|----------|------|
| online | window | Updates sync indicator, enables sync | 12733 |
| offline | window | Updates sync indicator | 12737 |
| visibilitychange | document | Triggers sync if online | 13634 |
| beforeinstallprompt | window | Defers PWA install prompt | 39195 |
| DOMContentLoaded | document | Tag input handlers | 31282 |

**No pub/sub or custom event bus.** All inter-module communication is via direct function calls and global state `S`.

---

# SECTION 8: THUMBWHEEL INTEGRATION

## Panel Wheels (Scroll-to-Select)

| Wheel ID | Populates From | Selection Action | Line |
|----------|----------------|------------------|------|
| crmWheel | S.prospects | selectCrmItem(id) | 9733 |
| taskWheel | S.tasks | selectTaskItem(id) | 9817 |
| missWheel | S.tasks (missions) | selectMissItem(id) | 9845 |
| contactWheel | S.contacts | selectContact(id) | 11023 |
| outreachWheel | S.prospects + "NEW" | selectOutreach(id) | 11727 |
| dayWheel | Time slots for date | handleSlotTap() | 9611 |
| weekDayWheel | Day-of-week | selectWeekDay(idx) | 9654 |

## Modal Category Wheels (Field Navigation)

| Wheel ID | Fields | Line |
|----------|--------|------|
| evtCatWheel | Title, Type, Time, Link, Remind, Assign, Notes, Save | 9470 |
| jobCatWheel | Title, Client, Service, Status, Notes, Assign | 10400 |
| invoiceCatWheel | Client, Items, Due, Notes | 10634 |
| productCatWheel | Name, Price, Description, Stock | 11495 |
| serviceCatWheel | Name, Rate, Duration, Availability | 11650 |
| contactCatWheel | Name, Phone, Email, Relation | (modal) |

---

# SECTION 9: SIMPL MODULES INVENTORY

## Individual Modules (HELIX-MODULES-V1)

| File | Module | Lines | Data Entities | Key Functions |
|------|--------|-------|---------------|---------------|
| 02-InvoiceGenerator.jsx | Invoices | 1,030 | Services, Invoices, Line Items | generateInvoice(), addService() |
| 03-ExpenseTracker.jsx | Expenses | 665 | Expenses (vendor, category, amount) | addExpense(), filterByCategory() |
| 04-Dashboard.jsx | Dashboard | 602 | Revenue, Expenses, Profit (computed) | calcProfitMargin(), trendAnalysis() |
| 05-FamilyBudget.jsx | Budget | 938 | Envelopes, Savings Goals, Bills, Debts | setBudgetMethod(), calcDebtPayoff() |
| 06-BalanceSheet.jsx | Balance | 628 | Assets, Liabilities, Equity | validateBalance(), exportStatement() |
| 07-ReceiptStorage.jsx | Receipts | 606 | Receipts (vendor, amount, category) | addReceipt(), sumByCategory() |
| 08-TimeTracker.jsx | Time | 612 | Time Entries (client, project, rate) | startTracking(), calcBillableAmount() |
| 09-BankSync-MainApp.jsx | Banking | 793 | Accounts, Transactions | syncAccount(), categorizeTransaction() |

## Packed Version (mod-PACKED-S15, 19,436 lines)

| ID | Module | Icon |
|----|--------|------|
| DASH | Dashboard | LayoutDashboard |
| PL | P&L Wizard | TrendingUp |
| INV | Invoices | FileText |
| TIME | Time Tracker | Clock |
| EXP | Expenses | Receipt |
| REC | Receipts | Camera |
| BAL | Balance Sheet | Scale |
| BUD | Budget | PiggyBank |
| BANK | Banking | Building2 |
| RPT | Reports | BarChart3 |

**Architecture:** React Context + useReducer, localStorage key `'simpl-data'`, glass/vault theme, Lucide icons, 3D isometric charts, drawer-based navigation.

---

# SECTION 10: OVERLAP ANALYSIS

| Feature | Helix (Current) | SIMPL | Winner | Integration Strategy |
|---------|-----------------|-------|--------|---------------------|
| Invoices | Full builder, line items, PDF | Simple service→invoice | Helix | SIMPL dashboard reads Helix invoices |
| Time Tracking | Job timers, timeEntries[] | Standalone stopwatch, rates | Merge | Unify into Helix job system |
| Expenses | Job expenses[] only | Full module (vendor, category) | SIMPL | Add SIMPL expense tracking to S |
| Budget | Not present | Zero-based, envelopes, debt payoff | SIMPL | New module, new S.budgets[] |
| Balance Sheet | Not present | Assets/Liabilities/Equity | SIMPL | New module, new S.balanceSheet |
| Receipts | Not present | Vendor, amount, category | SIMPL | New module, new S.receipts[] |
| Banking | Plaid Edge Functions (just built) | Manual accounts/transactions | Helix | Helix backend, SIMPL-style UI |
| Dashboard | Revenue by source chart | Full KPI aggregation, 3D charts | SIMPL | Replace Helix revenue widget |
| P&L | Not present | Full P&L wizard | SIMPL | New module |
| Reports | Not present | Report generation | SIMPL | New module |
| Storage | Supabase + localStorage | localStorage only | Helix | SIMPL entities migrate to S + Supabase |

---

# SUMMARY STATS

- Total Cascade functions: **16**
- Total Crossroads handler combos: **40+** (100+ specific handlers in allHandlers)
- Total Modals: **18** (11 static + 5 dynamic personals + 2 pickers)
- Total Panels: **12** (5 L1 + 6 L2 + banking)
- Total Thumbwheels: **17** (7 panel + 10 modal category)
- Total SYNC_ENTITIES: **26**
- Total localStorage keys: **4** (scV12, helix_pending, helix_session, helix_last_sync)
- Custom events: **0** (direct function calls only)
- Existing drag-drop: **Yes** — full Crossroads system (long-press → orbital HUD)

---

# RECOMMENDED SIMPL INSERTION POINTS

## 1. New State Entities (add to S object, line ~12350)
```javascript
expenses: [],      // SIMPL Expense Tracker
receipts: [],      // SIMPL Receipt Storage
budgets: [],       // SIMPL Budget (envelopes, goals, bills, debts)
balanceSheet: {},  // SIMPL Balance Sheet (assets, liabilities, equity)
```

## 2. New SYNC_ENTITIES (add to array, line ~13247)
```javascript
'expenses', 'receipts', 'budgets'
// balanceSheet goes in SYNC_CONFIG_KEYS (single object, not array)
```

## 3. New Panels (add after panel-banking, line ~11175)
- `panel-expenses` — Expense Tracker (SIMPL EXP module)
- `panel-receipts` — Receipt Storage (SIMPL REC module)
- `panel-budget` — Budget Planner (SIMPL BUD module)
- `panel-balance` — Balance Sheet (SIMPL BAL module)
- `panel-dashboard` — Financial Dashboard (SIMPL DASH module, replaces revenue widget)
- `panel-pnl` — P&L Wizard (SIMPL PL module)
- `panel-reports` — Reports (SIMPL RPT module)

## 4. New L2 HUD Buttons or L3 Financial Layer
The current L2 has 5 buttons (services, jobs, invoices, contacts, banking). Adding 7 more is too many for one layer. Options:
- **Option A:** Create Layer 3 for SIMPL financial modules (DASH, P&L, EXP, REC, BAL, BUD, RPT)
- **Option B:** Sub-menu on existing banking button that expands to full financial suite
- **Option C:** Financial dashboard panel with module navigation inside it (SIMPL's drawer pattern)

## 5. Cascade Extensions
- `cascadeFromExpense()` — after expense save: link to job, link to receipt
- `cascadeFromReceipt()` — after receipt: create expense entry
- Invoice paid status → update P&L and Balance Sheet
- Job complete → update Dashboard KPIs

## 6. Crossroads Extensions
- Add to subDestMap: expense→jobs, expense→invoices, receipt→expenses
- Add to btnMap: bExpenses, bReceipts, bBudget (if using L3)
- Add to allHandlers: financial cross-linking handlers

## 7. Data Migration Strategy
- SIMPL's `'simpl-data'` localStorage → migrate to Helix's `S` object
- SIMPL React components → port rendering logic to vanilla JS (match V3OG aesthetic)
- SIMPL's Context+Reducer → maps to Helix's `save(entityType, entityId, action)` pattern
- Supabase tables needed: expenses, receipts, budgets (+ RLS policies)

## 8. Banking Integration
- Plaid Edge Functions (already built) serve as backend
- SIMPL's BankSync UI pattern replaces the basic banking panel
- Transaction categorization from SIMPL feeds into expense tracking
- Bank reconciliation UI (already built) connects transactions → invoices/jobs

# HELIX CASCADE MATRIX
## Comprehensive Cross-Module Relationship Architecture
## For Claude Code Handoff — March 2026

---

# EXECUTIVE SUMMARY

Helix has two interconnected routing systems:
1. **Crossroads** — Drag-drop card routing between modules (120+ handlers)
2. **Cascade** — Auto-action chains triggered by module events (save, complete, etc.)

This document maps every connection, identifies gaps, and provides implementation patterns for Claude Code to complete the system.

---

# SECTION 1: THE MONEY CHAIN (CRITICAL PATH)

The primary business flow must work flawlessly:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HELIX MONEY CHAIN                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SERVICE (rate/duration)                                               │
│      │                                                                  │
│      ├──► cascadeFromService() ──► JOB (pending, links serviceId)      │
│      │                               │                                  │
│   BOOKING (client/date/time)         │                                  │
│      │                               │                                  │
│      └──► cascadeFromBooking() ──────┤                                  │
│           │                          │                                  │
│           └──► Creates EVENT         │                                  │
│               (links bookingId)      │                                  │
│                                      │                                  │
│                                      ▼                                  │
│                                    JOB                                  │
│                    (timer, notes, status: pending→active→complete)      │
│                                      │                                  │
│                    ┌─────────────────┴─────────────────┐                │
│                    │                                   │                │
│                    ▼                                   ▼                │
│            cascadeFromJob()              generateInvoiceFromJob()       │
│            (cascade button)              (view mode "Invoice" btn)      │
│                    │                                   │                │
│                    └─────────────────┬─────────────────┘                │
│                                      │                                  │
│                                      ▼                                  │
│                                  INVOICE                                │
│                    (line items, tax, discount, pay link)                │
│                    (status: draft→sent→paid)                            │
│                                      │                                  │
│                                      ▼                                  │
│                           cascadeFromInvoice()                          │
│                                      │                                  │
│                                      ▼                                  │
│                                    TASK                                 │
│                           (follow-up reminder)                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 2: CASCADE FUNCTION INVENTORY

## 2.1 Core Business Cascade Functions

| Function | Location | Trigger | Creates | Opens | Status |
|----------|----------|---------|---------|-------|--------|
| `cascadeFromService()` | ~20027 | Service modal cascade btn | Job | Jobs panel | ✅ Wired |
| `cascadeFromBooking()` | ~22094 | Booking modal cascade btn | Job + Event | Jobs panel | ✅ Wired |
| `cascadeFromJob()` | ~21073 | Job modal cascade btn (status=complete) | Invoice | Invoices panel | ✅ Wired |
| `generateInvoiceFromJob()` | ~21083 | Job view mode "Invoice" btn | Invoice | Invoices panel | ✅ Wired |
| `cascadeFromInvoice()` | ~21653 | Invoice modal cascade btn | Task | Tasks panel | ✅ Wired |

## 2.2 Data Linking Requirements

Each cascade MUST properly link parent references:

```javascript
// Job from Service
job.serviceId = service.id;
job.title = service.name;
job.rate = service.rate;
job.rateType = service.rateType;

// Job from Booking
job.bookingId = booking.id;
job.serviceId = booking.serviceId;
job.clientId = booking.clientId;
job.scheduledDate = booking.date;
job.scheduledTime = booking.time;

// Event from Booking
event.bookingId = booking.id;
event.jobId = job.id;  // Link to newly created job
event.date = booking.date;
event.time = booking.time;
event.title = booking.serviceName + ' - ' + booking.clientName;
event.type = 'booking';

// Invoice from Job
invoice.jobId = job.id;
invoice.clientId = job.clientId;
invoice.serviceId = job.serviceId;
invoice.lineItems = [{
  description: job.title,
  quantity: job.duration || 1,
  rate: job.rate,
  total: (job.duration || 1) * job.rate
}];

// Task from Invoice
task.invoiceId = invoice.id;
task.prospectId = invoice.clientId;
task.title = 'Follow up: Invoice #' + invoice.number;
task.due = invoice.dueDate;
task.type = 'followup';
```

## 2.3 Cascade Row Visibility Logic

Each modal has a `*CascadeRow` element. Show/hide rules:

| Modal | Row ID | Show When |
|-------|--------|-----------|
| Service | `serviceCascadeRow` | Editing existing service (has ID) |
| Booking | `bookingCascadeRow` | Editing existing booking (has ID) |
| Job | `jobCascadeRow` | Job status === 'complete' |
| Invoice | `invoiceCascadeRow` | Invoice status === 'sent' OR 'overdue' |

## 2.4 Cascade Button Labels

| Module | Button Text | Action |
|--------|-------------|--------|
| Service | "Create Job for this service" | Creates pending Job |
| Booking | "Create Job + Schedule" | Creates Job + Event |
| Job | "Generate invoice" | Creates draft Invoice |
| Invoice | "Create follow-up task" | Creates Task |

---

# SECTION 3: CROSSROADS SYSTEM

## 3.1 Architecture

```javascript
// Two key objects define the system:

const subDestMap = {
  'source-dest': [
    { key: 'actionKey', label: 'Action Label', icon: '✦', desc: 'Description' },
    // ... more actions
  ]
};

const allHandlers = {
  'source-dest/actionKey': function(data) {
    // Execute the crossroads deposit
    // data = { name, meta, status, id, sourceType, sourceData }
  }
};
```

## 3.2 Source Types (16)

| Type | Data Array | Card Class | Color |
|------|------------|------------|-------|
| `prospect` | S.prospects | `.prospect-card` | amber |
| `note` | S.notes | `.prospect-card` | red |
| `task` | S.tasks | `.prospect-card` | purple |
| `event` | S.events | `.prospect-card` | cyan |
| `mission` | S.missions | `.prospect-card` | purple |
| `contact` | S.contacts | `.prospect-card` | green |
| `product` | S.products | `.prospect-card` | amber |
| `service` | S.services | `.prospect-card` | green |
| `booking` | S.bookings | `.prospect-card` | cyan |
| `job` | S.jobs | `.prospect-card` | blue |
| `invoice` | S.invoices | `.prospect-card` | gold |
| `clique` | S.cliques | `.prospect-card` | magenta |
| `place` | S.places | `.prospect-card` | rose |
| `function` | S.functions | `.prospect-card` | indigo |
| `romance` | S.romances | `.prospect-card` | rose |
| `quest` | S.quests | `.prospect-card` | indigo |

## 3.3 Destination Targets (10)

| Target | Element ID | Panel | Color |
|--------|------------|-------|-------|
| `email` | `bEml` | Connect | green |
| `schedule` | `ring` (center) | Schedule | cyan |
| `crm` | `bCRM` | CRM | amber |
| `tasks` | `bMis` | Tasks | purple |
| `notes` | `bNotes` | Notes | red |
| `services` | — | Services | green |
| `jobs` | — | Jobs | blue |
| `invoices` | — | Invoices | gold |
| `contacts` | — | Contacts | green |
| `personals` | — | Personals | pink |

## 3.4 Current Handler Count

**Last Audit (v58): ~121 handlers in allHandlers**

Breakdown:
- Layer 1 (Connect, Schedule, CRM, Tasks, Notes): ~70 handlers
- Layer 2 (Products, Services, Bookings, Contacts): ~35 handlers  
- Business Suite (Jobs, Invoices): ~10 handlers
- Personals (Cliques, Places, Functions, Romance, Quests): ~6 handlers (GAPS)

---

# SECTION 4: FULL CASCADE MATRIX

## Legend
- ✅ = Implemented with smart matching
- ⚡ = Implemented basic (no smart matching)
- 📋 = In subDestMap but no handler
- ❌ = Not defined
- 🚫 = Disabled (same-to-same)

---

## 4.1 FROM: NOTE

| To → | email | schedule | crm | tasks | notes | services | jobs | invoices |
|------|-------|----------|-----|-------|-------|----------|------|----------|
| emailAbout | ✅ | - | - | - | - | - | - | - |
| useTemplate | ⚡ | - | - | - | - | - | - | - |
| createEvent | - | ✅ | - | - | - | - | - | - |
| redDot | - | ⚡ | - | - | - | - | - | - |
| linkExisting | - | ⚡ | - | - | - | - | - | - |
| reminder | - | ⚡ | - | - | - | - | - | - |
| linkProspect | - | - | ✅ | - | - | - | - | - |
| newProspect | - | - | ⚡ | - | - | - | - | - |
| addHistory | - | - | ✅ | - | - | - | - | - |
| createTask | - | - | - | ✅ | - | - | - | - |
| asSubtasks | - | - | - | ⚡ | - | - | - | - |
| addToExisting | - | - | - | ⚡ | - | - | - | - |
| Same | - | - | - | - | 🚫 | - | - | - |
| logTime | - | - | - | - | - | ⚡ | - | - |
| attachToJob | - | - | - | - | - | - | ❌ | - |
| addToInvoice | - | - | - | - | - | - | - | ❌ |

---

## 4.2 FROM: TASK

| To → | email | schedule | crm | tasks | notes | services | jobs | invoices |
|------|-------|----------|-----|-------|-------|----------|------|----------|
| emailAbout | ✅ | - | - | - | - | - | - | - |
| requestHelp | ⚡ | - | - | - | - | - | - | - |
| delegate | ⚡ | - | - | - | - | - | - | - |
| blockTime | - | ✅ | - | - | - | - | - | - |
| setDeadline | - | ⚡ | - | - | - | - | - | - |
| addReminder | - | ⚡ | - | - | - | - | - | - |
| linkProspect | - | - | ✅ | - | - | - | - | - |
| logActivity | - | - | ✅ | - | - | - | - | - |
| Same | - | - | - | 🚫 | - | - | - | - |
| document | - | - | - | - | ⚡ | - | - | - |
| statusNote | - | - | - | - | ⚡ | - | - | - |
| convertToJob | - | - | - | - | - | - | ❌ | - |

---

## 4.3 FROM: EVENT

| To → | email | schedule | crm | tasks | notes | services | jobs | invoices |
|------|-------|----------|-----|-------|-------|----------|------|----------|
| emailAttendee | ✅ | - | - | - | - | - | - | - |
| sendInvite | ⚡ | - | - | - | - | - | - | - |
| Same | - | 🚫 | - | - | - | - | - | - |
| linkProspect | - | - | ✅ | - | - | - | - | - |
| logMeeting | - | - | ✅ | - | - | - | - | - |
| prepTask | - | - | - | ✅ | - | - | - | - |
| followUp | - | - | - | ⚡ | - | - | - | - |
| meetingNotes | - | - | - | - | ✅ | - | - | - |
| callNotes | - | - | - | - | ⚡ | - | - | - |
| convertToJob | - | - | - | - | - | - | ❌ | - |

---

## 4.4 FROM: PROSPECT

| To → | email | schedule | crm | tasks | notes | services | jobs | invoices |
|------|-------|----------|-----|-------|-------|----------|------|----------|
| quickEmail | ✅ | - | - | - | - | - | - | - |
| useTemplate | ⚡ | - | - | - | - | - | - | - |
| scheduleCall | - | ✅ | - | - | - | - | - | - |
| scheduleMeeting | - | ⚡ | - | - | - | - | - | - |
| Same | - | - | 🚫 | - | - | - | - | - |
| followUpTask | - | - | - | ✅ | - | - | - | - |
| customTask | - | - | - | ⚡ | - | - | - | - |
| newNote | - | - | - | - | ✅ | - | - | - |
| callNotes | - | - | - | - | ⚡ | - | - | - |
| createJob | - | - | - | - | - | - | ❌ | - |
| createInvoice | - | - | - | - | - | - | - | ❌ |

---

## 4.5 FROM: SERVICE

| To → | email | schedule | crm | tasks | notes | jobs | invoices | bookings |
|------|-------|----------|-----|-------|-------|------|----------|----------|
| sendQuote | ⚡ | - | - | - | - | - | - | - |
| scheduleService | - | ⚡ | - | - | - | - | - | - |
| linkClient | - | - | ⚡ | - | - | - | - | - |
| prepTask | - | - | - | ⚡ | - | - | - | - |
| serviceNotes | - | - | - | - | ⚡ | - | - | - |
| createJob | - | - | - | - | - | ✅ | - | - |
| createInvoice | - | - | - | - | - | - | ⚡ | - |
| createBooking | - | - | - | - | - | - | - | ⚡ |

---

## 4.6 FROM: JOB

| To → | email | schedule | crm | tasks | notes | services | jobs | invoices |
|------|-------|----------|-----|-------|-------|----------|------|----------|
| emailClient | ⚡ | - | - | - | - | - | - | - |
| scheduleFollowup | - | ⚡ | - | - | - | - | - | - |
| updateClient | - | - | ⚡ | - | - | - | - | - |
| createTask | - | - | - | ⚡ | - | - | - | - |
| jobNotes | - | - | - | - | ⚡ | - | - | - |
| Same | - | - | - | - | - | - | 🚫 | - |
| generateInvoice | - | - | - | - | - | - | - | ✅ |

---

## 4.7 FROM: INVOICE

| To → | email | schedule | crm | tasks | notes | jobs | invoices |
|------|-------|----------|-----|-------|-------|------|----------|
| sendInvoice | ✅ | - | - | - | - | - | - |
| sendReminder | ⚡ | - | - | - | - | - | - |
| scheduleFollowup | - | ⚡ | - | - | - | - | - |
| updateClient | - | - | ⚡ | - | - | - | - |
| followUpTask | - | - | - | ✅ | - | - | - |
| paymentNotes | - | - | - | - | ⚡ | - | - |
| linkJob | - | - | - | - | - | ⚡ | - |
| Same | - | - | - | - | - | - | 🚫 |

---

## 4.8 FROM: BOOKING

| To → | email | schedule | crm | tasks | notes | services | jobs |
|------|-------|----------|-----|-------|-------|----------|------|
| confirmBooking | ✅ | - | - | - | - | - | - |
| sendReminder | ⚡ | - | - | - | - | - | - |
| addToCalendar | - | ✅ | - | - | - | - | - |
| linkClient | - | - | ⚡ | - | - | - | - |
| prepTask | - | - | - | ⚡ | - | - | - |
| bookingNotes | - | - | - | - | ⚡ | - | - |
| linkService | - | - | - | - | - | ⚡ | - |
| createJob | - | - | - | - | - | - | ✅ |

---

## 4.9 FROM: PERSONALS (CLIQUES, PLACES, FUNCTIONS, ROMANCE, QUESTS)

### ⚠️ MAJOR GAP — THESE NEED FULL WIRING

| Source | To Schedule | To Tasks | To Notes | To CRM | Status |
|--------|-------------|----------|----------|--------|--------|
| clique | ❌ | ❌ | ❌ | ❌ | NOT WIRED |
| place | ❌ | ❌ | ❌ | ❌ | NOT WIRED |
| function | ❌ | ❌ | ❌ | ❌ | NOT WIRED |
| romance | ❌ | ❌ | ❌ | ❌ | NOT WIRED |
| quest | ❌ | ❌ | ❌ | ❌ | NOT WIRED |

**Recommended Crossroads for Personals:**

```javascript
// CLIQUE crossroads
'clique-email': [
  { key: 'groupEmail', label: 'Group Email', icon: '✉', desc: 'Email all members' }
],
'clique-schedule': [
  { key: 'planGathering', label: 'Plan Gathering', icon: '📅', desc: 'Schedule group event' }
],
'clique-tasks': [
  { key: 'groupTask', label: 'Group Task', icon: '☑', desc: 'Task for the group' }
],
'clique-notes': [
  { key: 'cliqueNotes', label: 'Clique Notes', icon: '✎', desc: 'Notes about group' }
]

// PLACE crossroads
'place-schedule': [
  { key: 'planVisit', label: 'Plan Visit', icon: '📅', desc: 'Schedule visit' }
],
'place-notes': [
  { key: 'placeNotes', label: 'Place Notes', icon: '✎', desc: 'Notes about place' }
]

// FUNCTION crossroads
'function-schedule': [
  { key: 'addToCalendar', label: 'Add to Calendar', icon: '📅', desc: 'Schedule function' }
],
'function-tasks': [
  { key: 'planningTasks', label: 'Planning Tasks', icon: '☑', desc: 'Create planning tasks' }
],
'function-notes': [
  { key: 'functionNotes', label: 'Function Notes', icon: '✎', desc: 'Planning notes' }
]

// ROMANCE crossroads
'romance-schedule': [
  { key: 'planDate', label: 'Plan Date', icon: '📅', desc: 'Schedule a date' }
],
'romance-notes': [
  { key: 'romanceNotes', label: 'Notes', icon: '✎', desc: 'Relationship notes' }
],
'romance-tasks': [
  { key: 'giftReminder', label: 'Gift Reminder', icon: '🎁', desc: 'Remember gift/occasion' }
]

// QUEST crossroads  
'quest-tasks': [
  { key: 'questSteps', label: 'Quest Steps', icon: '☑', desc: 'Break into tasks' }
],
'quest-schedule': [
  { key: 'setMilestone', label: 'Set Milestone', icon: '📅', desc: 'Schedule milestone' }
],
'quest-notes': [
  { key: 'questNotes', label: 'Quest Notes', icon: '✎', desc: 'Progress notes' }
]
```

---

# SECTION 5: IMPLEMENTATION PATTERNS

## 5.1 Adding a New Crossroads Handler

```javascript
// 1. Add to subDestMap
const subDestMap = {
  // ... existing entries
  'newSource-destType': [
    { key: 'actionKey', label: 'Action Label', icon: '✦', desc: 'What it does' },
    { key: 'actionKey2', label: 'Second Action', icon: '✎', desc: 'Alternative' }
  ]
};

// 2. Add handler to allHandlers
const allHandlers = {
  // ... existing handlers
  'newSource-destType/actionKey': function(data) {
    // data.name — card title
    // data.meta — card meta line
    // data.status — card status
    // data.id — source item ID
    // data.sourceType — 'newSource'
    // data.sourceData — full source object
    
    const item = data.sourceData;
    
    // Open destination panel
    openPanel('destType');
    
    // Create new item or link existing
    setTimeout(() => {
      if (typeof openDestModal === 'function') {
        openDestModal(item.prospectId || null);
        // Pre-fill fields
        setTimeout(() => {
          const titleInput = document.getElementById('destTitleInput');
          if (titleInput) titleInput.value = item.title || data.name;
        }, 150);
      }
    }, 200);
  }
};
```

## 5.2 Adding a New Cascade Function

```javascript
function cascadeFromNewModule() {
  // 1. Get current item ID from modal
  const id = document.getElementById('newModuleId').value;
  const item = (S.newModules || []).find(x => x.id === id);
  if (!item) return;
  
  // 2. Create the cascaded item
  const newItem = {
    id: uid(),
    title: 'From: ' + item.title,
    sourceId: item.id,
    sourceType: 'newModule',
    created: new Date().toISOString(),
    status: 'pending'
    // ... other fields
  };
  
  // 3. Add to destination array
  S.destinationItems = S.destinationItems || [];
  S.destinationItems.push(newItem);
  
  // 4. Update source item status
  item.status = 'cascaded';
  item.cascadedTo = newItem.id;
  
  // 5. Save state
  save();
  
  // 6. Close current modal
  closeModal('newModuleModal');
  
  // 7. Open destination panel
  openPanel('destinationPanel');
  
  // 8. Render destination
  renderDestination();
  
  // 9. Toast confirmation
  toast('✓ Created ' + newItem.title);
  
  // 10. Optionally open new item's modal
  setTimeout(() => {
    openDestModal(newItem.id);
  }, 300);
}
```

## 5.3 Cascade Row HTML Pattern

```html
<div id="moduleNameCascadeRow" class="cascade-row" style="display:none;">
  <button class="cascade-btn" onclick="cascadeFromModuleName()">
    <svg><!-- cascade icon --></svg>
    <span>Create Next Thing</span>
  </button>
</div>
```

## 5.4 Show/Hide Cascade Row in openModal()

```javascript
function openModuleModal(id) {
  const isEdit = !!id;
  const cascadeRow = document.getElementById('moduleNameCascadeRow');
  
  if (cascadeRow) {
    // Show cascade only when editing existing item
    // AND when item meets cascade criteria (e.g., status === 'complete')
    const item = id ? S.modules.find(x => x.id === id) : null;
    const showCascade = isEdit && item && item.status === 'complete';
    cascadeRow.style.display = showCascade ? 'flex' : 'none';
  }
  
  // ... rest of modal setup
}
```

---

# SECTION 6: KNOWN ISSUES & GAPS

## 6.1 Priority Gaps (Claude Code Should Fix)

| Priority | Module | Issue | Fix Required |
|----------|--------|-------|--------------|
| P0 | Jobs | Verify cascade button shows only when status=complete | Test openJobModal() |
| P0 | Invoice | Verify cascade button shows only when status=sent/overdue | Test openInvoiceModal() |
| P1 | Personals | All 5 sub-modals lack crossroads handlers | Add 20+ handlers |
| P1 | Personals | All 5 sub-modals lack cascade functions | Add 5 cascade functions |
| P2 | Job→Invoice | Verify line items populate from job.service | Test generateInvoiceFromJob() |
| P2 | Invoice→Task | Verify task.invoiceId is set | Test cascadeFromInvoice() |

## 6.2 Testing Checklist

### Test 1: Service → Job
```
1. Open Services panel
2. Create new service (name: "Test Service", rate: $100/hr)
3. Save service
4. Re-open service modal
5. Look for cascade button "Create Job for this service"
6. Click it
7. VERIFY: Jobs panel opens with new Job
8. VERIFY: Job has correct serviceId linked
9. VERIFY: Job status = 'pending'
```

### Test 2: Booking → Job + Event
```
1. Open Bookings panel
2. Create new booking (customer: "Test Client", date: tomorrow)
3. Save booking
4. Re-open booking modal
5. Look for cascade button "Create Job + Schedule"
6. Click it
7. VERIFY: Jobs panel opens with new Job
8. VERIFY: Job has bookingId linked
9. VERIFY: Schedule panel has new Event
10. VERIFY: Event has bookingId and jobId linked
```

### Test 3: Job → Invoice
```
1. Open Jobs panel
2. Create or open existing Job
3. Set status to 'complete'
4. Look for cascade button "Generate invoice"
5. Click it
6. VERIFY: Invoices panel opens with new Invoice
7. VERIFY: Invoice has correct jobId linked
8. VERIFY: Invoice has line item from Job's service
9. VERIFY: Job status changed to 'invoiced'
```

### Test 4: Invoice → Task
```
1. Open Invoices panel
2. Create or open existing Invoice
3. Set status to 'sent' or 'overdue'
4. Look for cascade button "Create follow-up task"
5. Click it
6. VERIFY: Task created in S.tasks
7. VERIFY: Task title = "Follow up: Invoice #XXX"
8. VERIFY: Task due = invoice dueDate
9. VERIFY: Task has invoiceId field
```

---

# SECTION 7: CODE LOCATION QUICK REFERENCE

| System | Search Pattern | Approx Line Range |
|--------|----------------|-------------------|
| subDestMap | `const subDestMap` | 31600-31850 |
| allHandlers | `const allHandlers` | 31982-33100 |
| cascadeFromService | `function cascadeFromService` | ~20027 |
| cascadeFromBooking | `function cascadeFromBooking` | ~22094 |
| cascadeFromJob | `function cascadeFromJob` | ~21073 |
| generateInvoiceFromJob | `function generateInvoiceFromJob` | ~21083 |
| cascadeFromInvoice | `function cascadeFromInvoice` | ~21653 |
| getCardData | `function getCardData` | Search for it |
| depositCard | `function depositCard` | Search for it |
| executeDeposit | `function executeDeposit` | Search for it |
| findProspectMatches | `function findProspectMatches` | Search for it |

---

# SECTION 8: SMART MATCHING

The crossroads system includes smart prospect matching:

```javascript
function findProspectMatches(text) {
  if (!text || !S.prospects) return [];
  const lower = text.toLowerCase();
  return S.prospects.filter(p => {
    const biz = (p.biz || '').toLowerCase();
    const contact = (p.contact || '').toLowerCase();
    return biz.includes(lower) || lower.includes(biz) ||
           contact.includes(lower) || lower.includes(contact);
  });
}
```

**Usage:** When dropping a note titled "Woody's Pizza Meeting" onto CRM, it should auto-detect and offer to link to the "Woody's" prospect.

**Currently smart-matched handlers:** ~21 (search for `findProspectMatches` usage)

---

# SECTION 9: SESSION DIRECTIVE FOR CLAUDE CODE

```
DO:
- Use grep -n to find functions before editing
- Test cascade chain end-to-end after each fix
- Verify data linking (parentId fields)
- Check cascade row visibility logic
- Add toast confirmations to all cascades

DON'T:
- Use scrollIntoView() — breaks parent containers
- Add duplicate function definitions
- Skip the save() call after state changes
- Forget to call render functions after creating items
- Assume line numbers — always verify with grep

WHEN STUCK:
- Check for duplicate function names
- Check element IDs match between HTML and JS
- Check if modal is reading/writing correct hidden input
- console.log the data object before processing

MEASURE TWICE:
- grep for the function before editing
- Read 50 lines above and below the target
- Verify no duplicate definitions elsewhere
```

---

# SECTION 10: STATISTICS

## Current State (v58)
- **Total modules:** 16 source types × 10 destination targets = 160 possible combos
- **Disabled combos (same-to-same):** 10
- **Implemented handlers:** ~121
- **Coverage:** ~80%
- **Major gaps:** Personals (5 modules × 4 targets = 20 combos = 0 handlers)

## After Full Wiring
- **Target handlers:** ~145
- **Smart matching:** 30+ handlers
- **Cascade functions:** 10 (5 business + 5 personals)

---

*HELIX CASCADE MATRIX*
*Document Version: 1.0*
*Created: March 12, 2026*
*For: Claude Code Handoff*
*Helix Version: v58 (36,500+ lines)*

# HELIX — CLAUDE CODE HANDOFF PACKET
## Version: v58 (36,502 lines)
## Prepared: March 11, 2026
## Purpose: Complete technical and vision handoff for autonomous Claude Code workstation

---

# SECTION 1: WHAT IS HELIX?

## Core Identity

**HELIX** is a mobile-first, single-file HTML/JavaScript business management application targeting field sales operators and solo entrepreneurs. It is the anti-Salesforce—a one-time-purchase alternative to subscription SaaS bloat.

**Key differentiators:**
- **Single HTML file**: No backend, no build process, no dependencies
- **V3OG aesthetic**: Dark neon visual language that deliberately contrasts with corporate gray
- **Touch-native**: Designed for phone-in-hand field use
- **Interconnected**: Every item can flow to any other via Crossroads drag-drop and Cascade follow-ups

## Product Positioning

| Helix | vs | Enterprise CRM |
|-------|----|--------------------|
| One-time purchase | vs | $97-497/month subscriptions |
| 5-minute learning curve | vs | Weeks of training |
| Mobile-first, thumb-native | vs | Desktop-first, mouse-dependent |
| Beautiful dark interface | vs | Corporate gray |
| Single file, works offline | vs | Cloud-dependent |

## Dogfooding Context

**Smith+Canon** (Curt's ice cream company) is the testing ground for Helix. Some Smith+Canon-specific features exist in the codebase (Production, Inventory, Beans, Wares panels) but are NOT part of the retail Helix product.

**Retail Helix = Core 5 + Business Suite + Personals**

---

# SECTION 2: ARCHITECTURE OVERVIEW

## The Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 0: V3OG ORBITAL INTERFACE                             │
│ • 12-hour clock face                                        │
│ • Month/time scroll wheels                                  │
│ • Proximity-based color states                              │
│ • Acts as navigation hub AND ambient screensaver            │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: CORE 5 PANELS (The Universal Five)                 │
├─────────────┬───────────┬───────────┬───────────┬───────────┤
│  CONNECT    │ SCHEDULE  │   NOTES   │   TASKS   │   EMAIL   │
│  (CRM)      │ (Calendar)│ (Capture) │ (To-dos)  │ (Outreach)│
│  --green    │ --cyan    │ --red     │ --purple  │ --green   │
└─────────────┴───────────┴───────────┴───────────┴───────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: BUSINESS SUITE (SIMPL Financial Modules)           │
├──────────┬──────────┬──────────┬──────────┬────────┬────────┤
│ Products │ Services │ Bookings │   Jobs   │Invoices│Contacts│
│ --amber  │ --blue   │ --cyan   │ --blue   │ --gold │ --pink │
└──────────┴──────────┴──────────┴──────────┴────────┴────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: PERSONALS                                          │
├──────────┬──────────┬──────────┬──────────┬────────┬────────┤
│  People  │ Cliques  │  Places  │Functions │Romance │ Quests │
│  👤      │  👥      │   📍     │   🎉     │  💝    │  🎯    │
│ --pink   │--magenta │ --rose   │ --indigo │ --pink │--amber │
└──────────┴──────────┴──────────┴──────────┴────────┴────────┘
```

## Data Model

All state lives in a single `S` object, persisted to `localStorage`:

```javascript
const S = {
  // Core 5
  prospects: [],      // CRM contacts
  events: [],         // Calendar events
  notes: [],          // Quick capture notes
  tasks: [],          // To-do items
  missions: [],       // Pre-built 90-day plan (read-mostly)
  
  // Business Suite
  products: [],       // Inventory items
  services: [],       // Service offerings (with rates)
  bookings: [],       // Client appointments
  jobs: [],           // Time-tracked work sessions
  invoices: [],       // Generated invoices
  contacts: [],       // Address book (business contacts)
  
  // Personals
  cliques: [],        // Friend groups
  places: [],         // Favorite locations
  functions: [],      // Events you host
  dates: [],          // Romance planning
  quests: [],         // Personal bucket list
  
  // Settings & Meta
  paymentSettings: {},
  bookingSettings: {},
  availability: {},
  theme: 'dark'
};
```

---

# SECTION 3: THE MODAL SYSTEM (Card + Wheel Pattern)

## Universal Modal Structure

Every item type in Helix uses the same modal pattern. This is **critical for UI consistency**:

```
┌─────────────────────────────────────────────────────────────┐
│ MODAL HEADER                                             ✕  │
│ [Icon] [Title - e.g., "New Task"]                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐    ┌──────────────────────────────┐│
│  │                    │    │     CATEGORY WHEEL           ││
│  │   LIVE CARD        │    │                              ││
│  │   PREVIEW          │    │     Category 1 (faded)       ││
│  │                    │    │   ▸ Category 2 (selected) ◂  ││
│  │   Shows what the   │    │     Category 3 (faded)       ││
│  │   saved card will  │    │     Category 4 (faded)       ││
│  │   look like        │    │                              ││
│  │                    │    │   [Scrolls OR taps to jump]  ││
│  │   TAP TO SAVE      │    └──────────────────────────────┘│
│  ├────────────────────┤                                    │
│  │  Active Field      │    ← Only this section's fields    │
│  │  Input Controls    │      are visible at a time         │
│  │                    │                                    │
│  └────────────────────┘                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [CASCADE ROW - appears after save]                         │
│  "Schedule follow-up?"  "Create task?"  "Send email?"       │
├─────────────────────────────────────────────────────────────┤
│  [DELETE] (only visible when editing existing item)         │
└─────────────────────────────────────────────────────────────┘
```

## Key Behaviors

1. **Live card preview**: As user types, the card updates in real-time
2. **Wheel navigation**: Scroll OR tap wheel items to change visible field section
3. **Tap-to-save**: Tapping the card preview itself saves the item
4. **Cascade row**: After save, contextual follow-up actions appear
5. **Delete only in edit mode**: Delete button hidden when creating new items

## Wheel Categories by Modal

Each modal has field categories on the wheel:

| Modal | Wheel Categories |
|-------|------------------|
| Event | Details, Time, Link, Type |
| Task | Details, Priority, Status, Due |
| Prospect | Business, Contact, Type, Status |
| Note | Content, Tags, Link |
| Job | Details, Time, Client, Service |
| Invoice | Details, Items, Client, Status |
| Booking | Details, Time, Client, Service |
| Contact | Details, Phone, Email, Address |
| Clique | Details, Members, Status |
| Place | Details, Location, Category |
| Function | Details, Date, Guests |
| Date (Romance) | Details, Plan, Status |
| Quest | Details, Steps, Priority |

## Current Status

✅ **v58 Fix**: All 10 core modals now have `onclick` handlers on wheel items (was scroll-only before)

🔴 **Known Issue**: Some modals have CSS flex height issues causing black bands (Jobs, Invoices, some Personals)

---

# SECTION 4: THE CASCADE SYSTEM

## Purpose

After saving any item, Cascade offers contextual next actions. This creates a **flow state** where users naturally chain related items together.

## How It Works

```
User saves new Prospect
        ↓
┌─────────────────────────────────────────────────────────┐
│ ✓ "Pizzeria Lui" saved!                                 │
│                                                         │
│ [📅 Schedule Sample Drop?] [☑ Create Task?] [✉ Email?] │
└─────────────────────────────────────────────────────────┘
        ↓
User taps "Schedule Sample Drop"
        ↓
Schedule panel opens with pre-filled event:
  - Title: "Sample Drop: Pizzeria Lui"
  - Type: "sample"
  - Prospect linked
```

## Cascade Functions (10 total)

| Function | Location | Triggers |
|----------|----------|----------|
| `cascadeFromEvent()` | Line 13927 | After saving event |
| `cascadeFromProspect()` | Line 18243 | After saving prospect |
| `cascadeFromTask()` | Line 19916 | After saving task |
| `cascadeFromProduct()` | Line 20424 | After saving product |
| `cascadeFromService()` | Line 20985 | After saving service |
| `cascadeFromJob()` | Line 22296 | After saving job |
| `cascadeFromInvoice()` | Line 22982 | After saving invoice |
| `cascadeFromBooking()` | Line 23452 | After saving booking |
| `cascadeFromContact()` | Line 23756 | After saving contact |
| `cascadeFromNote()` | Line 27218 | After saving note |

## Critical Cascade Chain: Service → Job → Invoice

This is the **money flow** and must work perfectly:

```
SERVICE (defines rate, rate type)
    ↓ cascadeFromService() → "Create job from this service?"
JOB (tracks time, links to service + client)
    ↓ cascadeFromJob() → calls generateInvoiceFromJob()
INVOICE (auto-calculates from job time × service rate)
    ↓ cascadeFromInvoice() → "Send to client?" "Mark paid?"
```

---

# SECTION 5: THE CROSSROADS SYSTEM

## Purpose

**Crossroads** is the drag-and-drop system that allows any card to flow to any destination. Long-press a card, drag to a target in the HUD, release to create a linked item.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ SOURCE CARD (e.g., Prospect "Pizzeria Lui")             │
│                                                         │
│ Long-press (350ms) → Card lifts, becomes draggable      │
└────────────────────────┬────────────────────────────────┘
                         │ Drag toward HUD
                         ▼
┌─────────────────────────────────────────────────────────┐
│ HUD TARGETS (orbital ring buttons)                      │
│                                                         │
│ Valid targets glow when card hovers over them           │
│ Invalid targets stay dim                                │
└────────────────────────┬────────────────────────────────┘
                         │ Drop on target
                         ▼
┌─────────────────────────────────────────────────────────┐
│ SUB-DESTINATION MENU                                    │
│                                                         │
│ "What kind of [target] do you want to create?"          │
│                                                         │
│ [Option 1] [Option 2] [Option 3]                        │
└────────────────────────┬────────────────────────────────┘
                         │ Select option
                         ▼
┌─────────────────────────────────────────────────────────┐
│ HANDLER EXECUTES                                        │
│                                                         │
│ Creates new item with:                                  │
│ - Link back to source                                   │
│ - Pre-filled relevant data                              │
│ - Opens modal or panel                                  │
└─────────────────────────────────────────────────────────┘
```

## Sub-Destination Map

When dropping on a target, the sub-menu options come from `subDestMap`:

```javascript
const subDestMap = {
  schedule: ['Follow-Up', 'Meeting', 'Call', 'Demo', 'Task'],
  tasks: ['Follow-Up', 'Research', 'Prepare', 'Review'],
  notes: ['Meeting Notes', 'Call Notes', 'Research', 'Ideas'],
  email: ['Follow-Up', 'Introduction', 'Proposal', 'Thank You'],
  // ... etc
};
```

## Handler Registry

All crossroads handlers live in `allHandlers` object:

```javascript
const allHandlers = {
  'prospect→schedule→Follow-Up': (src) => { /* create follow-up event */ },
  'prospect→schedule→Meeting': (src) => { /* create meeting event */ },
  'prospect→tasks→Follow-Up': (src) => { /* create follow-up task */ },
  // ... hundreds of combinations
};
```

---

# SECTION 6: PANEL SYSTEM

## Panel Structure

Each panel follows this structure:

```
┌─────────────────────────────────────────────────────────┐
│ PANEL HEADER (p-hdr)                                    │
│ [Back ←] [Title] [+ Add] [Filter]                       │
├─────────────────────────────────────────────────────────┤
│ FILTER PILLS (optional)                                 │
│ [All] [Type A] [Type B] [Type C]                        │
├─────────────────────────────────────────────────────────┤
│ PANEL BODY (p-body)                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CARD 1                                              │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CARD 2                                              │ │
│ └─────────────────────────────────────────────────────┘ │
│ ... more cards ...                                      │
└─────────────────────────────────────────────────────────┘
```

## Panel Open/Close

```javascript
function openPanel(panelId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
  document.getElementById(panelId).classList.add('open');
  renderPanelContent(panelId);
}

function closePanel() {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
}
```

---

# SECTION 7: COLOR SYSTEM

## Base Colors

```css
:root {
  --black: #0A0A0A;
  --black-pure: #000;
  --white: #FFF;
  
  /* Primary accent */
  --amber: #F59E0B;
  --amber-bright: #FBBF24;
  --amber-dim: rgba(245,158,11,0.15);
  --amber-glow: rgba(245,158,11,0.6);
  
  /* Status colors */
  --green: #22C55E;    /* Success, Connect panel */
  --cyan: #06B6D4;     /* Schedule, info */
  --red: #EF4444;      /* Notes, urgent */
  --purple: #A855F7;   /* Tasks */
  --blue: #3B82F6;     /* Services, Jobs */
  --gold: #EAB308;     /* Invoices, money */
  --pink: #EC4899;     /* Contacts, People */
  
  /* Personals colors */
  --magenta: #D946EF;  /* Cliques */
  --rose: #F43F5E;     /* Places */
  --indigo: #6366F1;   /* Functions */
}
```

## Color Assignment by Module

| Module | Primary Color | CSS Variable |
|--------|---------------|--------------|
| Connect (CRM) | Green | `--green` |
| Schedule | Cyan | `--cyan` |
| Notes | Red | `--red` |
| Tasks | Purple | `--purple` |
| Email | Green | `--green` |
| Products | Amber | `--amber` |
| Services | Blue | `--blue` |
| Bookings | Cyan | `--cyan` |
| Jobs | Blue | `--blue` |
| Invoices | Gold | `--gold` |
| Contacts | Pink | `--pink` |
| People | Pink | `--pink` |
| Cliques | Magenta | `--magenta` |
| Places | Rose | `--rose` |
| Functions | Indigo | `--indigo` |
| Romance | Pink | `--pink` |
| Quests | Amber | `--amber` |

---

# SECTION 8: EVENT TYPES

## Built-in Event Types

```javascript
const defaultEvtTypes = [
  { id: 'meeting', name: 'Meeting', color: 'amber' },
  { id: 'call', name: 'Call', color: 'cyan' },
  { id: 'follow-up', name: 'Follow-Up', color: 'green' },
  { id: 'demo', name: 'Demo', color: 'purple' },
  { id: 'sample', name: 'Sample Drop', color: 'lime' },
  { id: 'site-visit', name: 'Site Visit', color: 'teal' },
  { id: 'personal', name: 'Personal', color: 'pink' },
  { id: 'travel', name: 'Travel', color: 'orange' },
  { id: 'deadline', name: 'Deadline', color: 'red' },
  { id: 'reminder', name: 'Reminder', color: 'blue' }
];
```

## Custom Event Types

Users can create custom event types via the color picker. These are stored in `S.customEvtTypes` and merged with defaults.

---

# SECTION 9: CRITICAL FUNCTIONS REFERENCE

## State Management

| Function | Purpose |
|----------|---------|
| `save()` | Persist `S` to localStorage |
| `load()` | Load `S` from localStorage |
| `exportData()` | Download `S` as JSON file |
| `importData()` | Load `S` from uploaded JSON |

## Rendering

| Function | Purpose |
|----------|---------|
| `renderProspects()` | Render Connect panel cards |
| `renderEvents()` | Render Schedule panel |
| `renderTasks()` | Render Tasks panel |
| `renderNotes()` | Render Notes panel |
| `updateOrb()` | Update orbital ring state/color |

## Modals

| Function | Purpose |
|----------|---------|
| `openEventModal(id?)` | Open event create/edit modal |
| `openProspectModal(id?)` | Open prospect create/edit modal |
| `openTaskModal(id?)` | Open task create/edit modal |
| `saveEvent()` | Save event from modal |
| `saveProspect()` | Save prospect from modal |
| `saveTask()` | Save task from modal |

## Utilities

| Function | Purpose |
|----------|---------|
| `toast(msg)` | Show toast notification |
| `haptic(type)` | Trigger haptic feedback |
| `formatDate(d)` | Format date for display |
| `genId()` | Generate unique ID |

---

# SECTION 10: KNOWN ISSUES (v58)

## Must Fix

| Issue | Severity | Notes |
|-------|----------|-------|
| Modal flex height black bands | 🔴 High | Jobs, Invoices, some Personals |
| Personals missing Cascade functions | 🔴 High | 5 functions need creation |
| Personals missing Crossroads handlers | 🟡 Medium | Need to add to allHandlers |

## Nice to Have

| Issue | Status | Notes |
|-------|--------|-------|
| Light theme polish | 🟡 Basic | Works but not refined |
| Print styles | ✅ Present | Basic print CSS exists |

---

# SECTION 11: TESTING PROTOCOL

## Modal CRUD Checklist

For each modal, verify:

```
[ ] CREATE
    [ ] Open modal (new) — fields empty
    [ ] Delete button hidden
    [ ] Card preview starts with placeholder
    [ ] Fill fields — card updates live
    [ ] Wheel scroll changes visible field
    [ ] Wheel TAP changes visible field
    [ ] Tap card / save button → item created
    [ ] Toast appears
    [ ] Item visible in panel
    [ ] Cascade row appears (if applicable)

[ ] READ (View Mode)
    [ ] Tap existing card → view mode opens
    [ ] All data displayed correctly
    [ ] Action buttons work (email, call, etc.)

[ ] UPDATE (Edit Mode)
    [ ] From view mode, tap EDIT
    [ ] All fields populated
    [ ] Delete button visible
    [ ] Make changes
    [ ] Save → changes persist

[ ] DELETE
    [ ] From edit mode, tap DELETE
    [ ] Confirm dialog appears
    [ ] Confirm → item removed
    [ ] Toast appears
    [ ] Modal closes
    [ ] Item gone from panel
```

## Crossroads Checklist

```
[ ] Hold card 350ms → floating card appears
[ ] Drag toward HUD → targets glow
[ ] Drop on valid target → sub-menu appears
[ ] Select option → handler executes
[ ] New item created with linked data
[ ] Panel opens to new item
[ ] New card has green highlight animation
```

## Cascade Checklist

```
[ ] Cascade row appears in modal after save
[ ] Correct options shown for item type
[ ] Tapping option opens correct modal
[ ] New modal has data pre-filled
[ ] Link back to original item preserved
```

---

# SECTION 12: ANTI-PATTERNS TO AVOID

## Template Literal Script Tags

❌ **WRONG**: Raw `<script>` inside template literal breaks parser
```javascript
const html = `<script>alert('hi')</script>`;  // BREAKS
```

✅ **RIGHT**: Escape with concatenation
```javascript
const html = '<scr' + 'ipt>alert("hi")<\/scr' + 'ipt>';
```

## Mobile Touch Events

❌ **WRONG**: `onclick` unreliable after touch on mobile
```html
<div onclick="doThing()">  <!-- May not fire -->
```

✅ **RIGHT**: Use `ontouchend` with double-fire prevention
```html
<div ontouchend="doThing(event)" onclick="doThing(event)">
```

## Wheel Scroll Positioning

❌ **WRONG**: `scrollIntoView()` displaces parent containers
```javascript
wheelItem.scrollIntoView({ block: 'center' });  // BREAKS layout
```

✅ **RIGHT**: Direct `scrollTop` calculation
```javascript
wheel.scrollTop = (index * itemHeight) - (wheel.offsetHeight / 2) + (itemHeight / 2);
```

## Duplicate Functions

❌ **WRONG**: Duplicate function silently overrides the correct one
```javascript
function deleteProspect(){ /* correct version */ }
// ... 1000 lines later ...
function deleteProspect(){ /* broken version - THIS ONE WINS */ }
```

✅ **RIGHT**: Always grep for duplicates when behavior unexpectedly breaks
```bash
grep -n "function deleteProspect" Helix-v58.html
```

---

# SECTION 13: IMMEDIATE PRIORITIES FOR CLAUDE CODE

## Priority 1: Business Suite Cascade/Crossroads Audit

1. Verify `cascadeFromService()` offers "Create Job"
2. Verify `cascadeFromBooking()` offers "Create Job"
3. Verify `cascadeFromJob()` offers more than just invoice
4. Test full flow: Service → Booking → Job → Invoice

## Priority 2: Personals Cascade Functions

Create 5 new cascade functions:
- `cascadeFromClique()`
- `cascadeFromPlace()`
- `cascadeFromFunction()`
- `cascadeFromDate()`
- `cascadeFromQuest()`

## Priority 3: Personals Crossroads Handlers

Add to `subDestMap` and `allHandlers`:
- All 5 Personals types → Core 5 targets
- Core types → Personals targets where relevant

## Priority 4: Settings Panel

Build unified Settings panel with:
- Display preferences (theme, fonts)
- Module configuration (enable/disable, primary/secondary order)
- Data export/import
- (Placeholder for future sync settings)

## Priority 5: Modal CSS Fixes

Audit and fix flex height issues causing black bands in:
- Jobs modal
- Invoices modal
- Any affected Personals modals

---

# APPENDIX A: SESSION WORKFLOW

## Recommended Pattern

```
1. UPLOAD current build
        ↓
2. AUDIT actual file state (grep, sed, view)
   - Don't trust memory or previous sessions
   - Don't write briefs before inspecting
        ↓
3. IDENTIFY priorities with user
        ↓
4. EXECUTE changes
   - Anti-choke: Once direction is clear, execute autonomously
   - Don't re-explain or ask permission
   - Show code, not process
        ↓
5. TEST critical paths
        ↓
6. PRODUCE continuity document for next session
```

## Key Learnings

1. **Audit before writing briefs**: Always inspect file state before producing specs
2. **Anti-choke execution**: When direction is clear, execute autonomously
3. **Measure twice**: Deliberate verification over speed
4. **Screenshot-driven debugging**: For visual issues, screenshots are fastest path
5. **Bash over conversation_search**: For this codebase, direct grep/sed is more reliable

## Design Consistency Enforcement

- **Connect panel = gold standard** for card structure
- All panels must match its card structure, filter pills, thumbwheel behavior
- One modal built to spec first (reference pattern), then replicated

---

*Handoff document created: March 11, 2026*
*Helix version: v58 (36,502 lines)*
*Purpose: Complete technical and vision handoff for Claude Code workstation*
*Author: Claude (via session with Curt)*

# HELIX COMPLETE FEATURE LIST
## For Claude Code: Audit, Fine-Tune, Add Missing
### Last Updated: March 12, 2026 (v58 — post-audit)

---

## OVERVIEW

This document contains every feature Helix has (or should have) across all modules. Use this to:
1. Audit current codebase for feature presence
2. Identify missing or incomplete implementations
3. Add/polish features to reach 100% completion

**Module Grades (as of v58):**
| Module | Grade | Status |
|--------|-------|--------|
| CRM | A | Complete |
| Tasks | A | Complete |
| Schedule | A | .ics export/import, conflict detection added |
| Notes | A | Complete |
| Connect (Email) | B+ | Missing: Tracking |
| Products | A- | Cascades wired, crossroads complete |
| Services | A- | Cascades wired, invoiceService() implemented |
| Bookings | A- | Cascades wired, prospect auto-creation added |
| Jobs | A- | Fully wired: crossroads, cascades, billable/rounding fixed |
| Invoices | A- | Fully wired: tax/discount persist, PDF export, unified numbering |
| Personals | A- | All 5 modals fully built (Card+Wheel), cascades + crossroads wired |
| UI/UX | A+ | Complete |

---

## SECTION 1: CRM FEATURES

### Core CRM
| Feature | Description | Status |
|---------|-------------|--------|
| Contact Management | Add, edit, store contacts | ✅ |
| Pipeline Stages | Lead → Contact → Close flow | ✅ |
| Custom Fields | Add your own data fields | ✅ |
| Activity Timeline | History of all interactions | ✅ |
| Notes on Prospects | Attach notes to contacts | ✅ UNIQUE |
| Email Templates | Pre-written outreach (18 templates × 3 tones) | ✅ |
| Status Tracking | Lead/Contact/Customer/Archived | ✅ |
| Tags & Labels | Categorize prospects | ✅ |
| Search & Filter | Find prospects quickly | ✅ |
| Star/Pin Favorites | Mark high-priority prospects | ✅ |
| Duplicate Detection | Warn on similar contacts | ✅ Added |
| Import/Export | CSV import, JSON export | ✅ |
| Bulk Actions | Multi-select: status change, delete, CSV export | ✅ Added |

### CRM Unique Features
| Feature | Description | Status |
|---------|-------------|--------|
| Long-Press Voice Input | Hold any field to dictate | ✅ UNIQUE |
| Smart Voice Parsing | Auto-detect prospect, actions, dates | ✅ UNIQUE |
| CRM-Linked Notes | Two-way note↔prospect relationship | ✅ UNIQUE |
| CRM-Linked Tasks | Tasks tied to prospects | ✅ UNIQUE |
| CRM-Linked Events | Events tied to prospects | ✅ UNIQUE |
| Prospect History View | Full timeline of all interactions | ✅ UNIQUE |
| Quick Actions | One-tap call, email, task, note | ✅ |

---

## SECTION 2: TASKS FEATURES

### Core Tasks
| Feature | Description | Status |
|---------|-------------|--------|
| Create Tasks | Add tasks with titles | ✅ |
| Due Dates | Set deadlines | ✅ |
| Natural Language Dates | "tomorrow", "next friday" | ✅ |
| Recurring Tasks | Daily/weekly/monthly repeat | ✅ |
| Subtasks | Break into smaller items | ✅ |
| Priority Levels | High/Medium/Low | ✅ |
| Task Types | Call, Email, Meeting, Follow-up, etc. | ✅ |
| Complete/Archive | Mark done, archive old | ✅ |
| Overdue Indicators | Visual warning for late tasks | ✅ |
| Filter by Status | All/Active/Completed/Overdue | ✅ |

### Tasks Unique Features
| Feature | Description | Status |
|---------|-------------|--------|
| Link to CRM Prospect | Associate task with contact | ✅ UNIQUE |
| Create from Voice | Speak to add tasks | ✅ UNIQUE |
| Mission System | 72 guided tasks across 12 weeks | ✅ UNIQUE |
| Smart Contact Field | Show phone/email when type=call/email | ✅ UNIQUE |
| Action Item Extraction | Note → auto-suggest task | ✅ |

---

## SECTION 3: SCHEDULE FEATURES

### Core Schedule
| Feature | Description | Status |
|---------|-------------|--------|
| Calendar View | Day/Week/Month views | ✅ |
| Create Events | Add events with details | ✅ |
| Event Types | Meeting, Call, Reminder, etc. | ✅ |
| Time Slots | Visual time grid | ✅ |
| All-Day Events | Flag for full-day items | ✅ |
| Recurring Events | Daily/weekly/monthly repeat | ✅ |
| Reminders | Push notification triggers | ⚠️ Service Worker needed |
| Drag & Drop | Move events on calendar | ✅ |
| Color Coding | By type or prospect | ✅ |
| Conflict Detection | Warn on overlapping events | ✅ Added (findEventConflicts) |

### Schedule Planned/Missing
| Feature | Description | Status |
|---------|-------------|--------|
| Google Calendar Sync | Two-way sync | ❌ Planned (use .ics instead) |
| .ics Export | Send calendar invites (single + bulk) | ✅ exportEventICS() + exportAllEventsICS() |
| .ics Import | Receive calendar invites | ✅ openImportICS() + parseICS() |
| Booking Links | Calendly-style public scheduling | ⚠️ Mode A exists, Mode B planned |
| Share Availability | Generate public availability link | ✅ (via Services) |

### Schedule Unique Features
| Feature | Description | Status |
|---------|-------------|--------|
| Orbital Clock Interface | Ambient time display | ✅ UNIQUE |
| Link to CRM Prospect | Events tied to prospects | ✅ |
| Proximity Colors | Time-based color changes | ✅ UNIQUE |

---

## SECTION 4: NOTES FEATURES

### Core Notes
| Feature | Description | Status |
|---------|-------------|--------|
| Create Notes | Text notes with titles | ✅ |
| Rich Text Formatting | Bold, italic, headers, lists | ✅ |
| Voice Capture | Dictate notes | ✅ |
| Photo Capture | Add images | ✅ |
| Tags | Categorize notes | ✅ |
| Color Coding | Visual categories | ✅ |
| Multiple Views | Cards, List, Timeline | ✅ |
| Archive | Hide old notes | ✅ |
| Pin Notes | Keep at top | ✅ |
| Search | Find notes by content | ✅ |

### Notes Unique Features
| Feature | Description | Status |
|---------|-------------|--------|
| Long-Press Voice Anywhere | Hold any input to dictate | ✅ UNIQUE |
| Smart Voice Parsing | Auto-detect type/prospect/actions | ✅ UNIQUE |
| Field-Sales Templates | Sample Drop, Site Visit, Call Log, etc. | ✅ UNIQUE |
| Link to CRM Prospects | Two-way relationship | ✅ UNIQUE |
| Create Task from Note | Extract action items | ✅ |
| Offline-First | Full function without internet | ✅ |

---

## SECTION 5: CONNECT (EMAIL) FEATURES

### Core Email
| Feature | Description | Status |
|---------|-------------|--------|
| Email Templates | 18 pre-written templates | ✅ |
| Tone Variants | Soft/Direct/Assumptive per template | ✅ |
| Personalization | Auto-fill prospect name, company | ✅ |
| Send via mailto: | Opens in user's email client | ✅ |
| Copy to Clipboard | Alternative to mailto | ✅ |
| Log Email Sent | Record in prospect history | ✅ |
| Template Categories | By industry (Pizza, Coffee, BBQ, etc.) | ✅ |

### Email Planned/Missing
| Feature | Description | Status |
|---------|-------------|--------|
| Open/Click Tracking | Pixel tracking | ❌ Requires backend |
| Automated Sequences | Drip campaigns | ⚠️ Manual via Tasks+Schedule |
| Real SMTP Sending | Send from Helix directly | ❌ Requires backend |

---

## SECTION 6: BUSINESS SUITE FEATURES

### Products Module
| Feature | Description | Status |
|---------|-------------|--------|
| Product Catalog | Name, SKU, price, description | ✅ |
| Stock Levels | Inventory count | ✅ |
| Reorder Alerts | Low stock warnings | ✅ |
| Product Categories | Organize by type | ✅ |
| Product Images | Photo attachment | ✅ |
| Price Variants | Multiple pricing tiers (label + price) | ✅ Added |
| Crossroads Integration | Drag to other modules | ✅ Complete |
| Cascade Integration | Auto-actions on save | ✅ Complete (productId linked) |

### Services Module
| Feature | Description | Status |
|---------|-------------|--------|
| Service Catalog | Name, rate, duration, description | ✅ |
| Hourly/Flat Rates | Pricing options | ✅ |
| Time Tracking | Log billable hours | ✅ |
| Service → Job Flow | Create job from service | ✅ cascadeFromService() |
| Booking Configuration | Availability settings | ✅ |
| Public Booking Page | Embeddable widget | ✅ Mode A |
| Crossroads Integration | Drag to other modules | ✅ Complete |

### Bookings Module
| Feature | Description | Status |
|---------|-------------|--------|
| Booking Requests | Inbound scheduling | ✅ |
| Booking → Event | Auto-create calendar event | ✅ cascadeFromBooking() |
| Booking → Prospect | Auto-create CRM entry | ✅ cascadeFromBooking() + smart match |
| Booking Status | Pending/Confirmed/Completed | ✅ |
| Availability Rules | Days, hours, buffer time | ✅ |

### Jobs Module
| Feature | Description | Status |
|---------|-------------|--------|
| Job Creation | Title, service, prospect | ✅ |
| Job Status | Not Started/In Progress/Complete | ✅ |
| Billable Flag | Mark as invoiceable (saved + enforced) | ✅ Fixed |
| Time Rounding | Round billable hours (1/6/15/30 min) | ✅ Fixed |
| Time Logging | Track hours on job | ✅ |
| Job → Invoice Flow | Generate invoice from job (with rounding) | ✅ Fixed |
| Crossroads Integration | Drag to other modules (10 handlers) | ✅ Complete |
| Cascade Integration | Auto-actions on save | ✅ Complete |

### Invoices Module
| Feature | Description | Status |
|---------|-------------|--------|
| Invoice Creation | From job or manual | ✅ |
| Line Items | Multiple items per invoice | ✅ |
| Invoice Status | Draft/Sent/Paid/Overdue | ✅ |
| Due Dates | Payment deadlines | ✅ |
| Tax & Discount | Persisted to invoice, calculated in total | ✅ Fixed |
| Invoice → Payment Link | Stripe/PayPal integration | ⚠️ Planned |
| PDF Export | Print-to-PDF via browser | ✅ Implemented |
| Crossroads Integration | Drag to other modules (9 handlers) | ✅ Complete |
| Cascade Integration | Auto-actions + job status update on send | ✅ Complete |

---

## SECTION 7: PERSONALS MODULE

### People (Little Black Book)
| Feature | Description | Status |
|---------|-------------|--------|
| Personal Contacts | Non-business relationships | ✅ |
| Relationship Type | Friend, Family, Acquaintance | ✅ |
| Birthday Tracking | With reminders | ✅ Field in modal |
| Contact Frequency | "Haven't talked in X days" | ✅ Field in modal |
| Modal | Full card+wheel modal (7 fields) | ✅ Complete |

### Cliques
| Feature | Description | Status |
|---------|-------------|--------|
| Friend Groups | College Crew, Work Friends, etc. | ✅ |
| Group Members | Link to People | ✅ |
| Group Events | Plan gatherings (cascade) | ✅ |
| Crossroads | 5 destinations (email/schedule/crm/tasks/notes) | ✅ |
| Modal | Full card+wheel modal (6 fields) | ✅ Complete |

### Places
| Feature | Description | Status |
|---------|-------------|--------|
| Favorite Locations | Restaurants, bars, venues | ✅ |
| Place Type | Restaurant, Bar, Park, etc. | ✅ |
| Recommendations | "Take Sarah here" | ✅ |
| Crossroads | 5 destinations + contacts/bookings | ✅ |
| Modal | Full card+wheel modal (6 fields) | ✅ Complete |

### Functions
| Feature | Description | Status |
|---------|-------------|--------|
| Event Planning | Parties, gatherings | ✅ |
| Planning Phases | Idea → Planning → Ready → Complete | ✅ |
| Invitees | Who's coming (guests field) | ✅ |
| Cascade | Creates 3 planning tasks | ✅ |
| Crossroads | 5 destinations + contacts/bookings | ✅ |
| Modal | Full card+wheel modal (7 fields) | ✅ Complete |

### Romance
| Feature | Description | Status |
|---------|-------------|--------|
| Dating Tracker | People you're seeing | ✅ |
| Date History | Log of dates | ✅ |
| Relationship Status | Dating → Exclusive → etc. | ✅ |
| Crossroads | 5 destinations | ✅ |
| Modal | Full card+wheel modal (6 fields) | ✅ Complete |

### Quests
| Feature | Description | Status |
|---------|-------------|--------|
| Personal Goals | Non-work challenges | ✅ |
| Milestones | Progress tracking (steps) | ✅ |
| Accountability | Link to People (partner field) | ✅ |
| Cascade | Creates next step task | ✅ |
| Crossroads | 5 destinations + contacts | ✅ |
| Modal | Full card+wheel modal (7 fields) | ✅ Complete |

---

## SECTION 8: UI/UX FEATURES

### Visual Design
| Feature | Description | Status |
|---------|-------------|--------|
| V3OG Dark Aesthetic | Neon glow, dark backgrounds | ✅ UNIQUE |
| Amber/Cyan Color Scheme | Primary accent colors | ✅ |
| Orbital Clock Interface | Ambient screensaver | ✅ UNIQUE |
| Module Color Coding | Each module has signature color | ✅ |
| Glow Effects | "Glow from within" philosophy | ✅ |
| Mobile-First Design | Phone-optimized | ✅ |
| Zero Learning Curve | Instant usability | ✅ |

### Interaction Patterns
| Feature | Description | Status |
|---------|-------------|--------|
| Card+Wheel Modals | Consistent modal pattern | ✅ |
| Thumbwheel Selectors | Scroll-to-select | ✅ |
| Crossroads Drag-Drop | Hold card → drop on target | ✅ |
| Cascade Follow-ups | Auto-suggest next actions | ✅ |
| Long-Press Actions | 350ms hold triggers | ✅ |
| Haptic Feedback | Vibration on actions (60+ calls) | ✅ |
| Toast Notifications | Non-blocking alerts | ✅ |

### Architecture
| Feature | Description | Status |
|---------|-------------|--------|
| Single HTML File | No dependencies | ✅ UNIQUE |
| Offline-First | localStorage persistence | ✅ |
| PWA Support | Installable app | ✅ |
| Zero Server Required | Works without backend | ✅ |
| Performance | Instant response | ✅ |

---

## SECTION 9: CROSSROADS SYSTEM

### Source Types (16)
| Source | Crossroads Enabled | Notes |
|--------|-------------------|-------|
| prospect | ✅ | Full handlers |
| event | ✅ | Full handlers |
| note | ✅ | Full handlers |
| task | ✅ | Full handlers |
| contact | ✅ | Full handlers |
| product | ✅ | Full handlers |
| service | ✅ | Full handlers |
| booking | ✅ | Full handlers |
| job | ✅ | 10 handlers (all destinations) |
| invoice | ✅ | 9 handlers (all destinations) |
| clique | ✅ | 5+2 handlers (core + contacts) |
| place | ✅ | 5+2 handlers (core + contacts/bookings) |
| function | ✅ | 5+2 handlers (core + contacts/bookings) |
| date (romance) | ✅ | 5 handlers (core destinations) |
| quest | ✅ | 5+1 handlers (core + contacts) |
| person | ✅ | See contacts module |

### Target Types (10)
| Target | Button | Status |
|--------|--------|--------|
| schedule | Ring button | ✅ |
| crm | Cyan button | ✅ |
| notes | Red button | ✅ |
| tasks | Purple button | ✅ |
| connect | Green button | ✅ |
| products | Orange button | ✅ |
| services | Green button | ✅ |
| bookings | Cyan button | ✅ |
| contacts | Pink button | ✅ |
| invoices | Gold button | ✅ |

---

## SECTION 10: CASCADE SYSTEM

### Established Cascades
| Trigger | Creates | Status |
|---------|---------|--------|
| Save Prospect | Suggest Task (follow-up) | ✅ |
| Save Event | Suggest Task (prep) | ✅ |
| Save Note | Suggest Task/Event (by type) | ✅ Fixed (noteId + prospectId linked) |
| Save Task | Suggest Event (calendar) | ✅ Fixed (taskId linked) |
| Complete Task | Update Prospect status | ✅ |
| Send Email | Log to Prospect history | ✅ |
| Save Product | Reorder task if low stock | ✅ Fixed (productId linked) |
| Service → Job | Create Job from Service | ✅ cascadeFromService() |
| Job → Invoice | Create Invoice from Job (with rounding) | ✅ generateInvoiceFromJob() |
| Booking → Event | Create Event from Booking | ✅ cascadeFromBooking() |
| Booking → Prospect | Create/Link Prospect from Booking | ✅ cascadeFromBooking() + smart match |
| Invoice Sent | Update Job status to 'invoiced' | ✅ sendInvoice() |
| Invoice Sent | Log to Prospect history | ✅ sendInvoice() |
| Functions → Tasks | 3 planning tasks auto-created | ✅ cascadeFromFunction() |
| Quests → Tasks | Next step task auto-created | ✅ cascadeFromQuest() |

### Not Yet Built
| Trigger | Should Create | Status |
|---------|---------------|--------|
| Schedule Conflict | Warn on overlapping events | ✅ Added |
| CRM Bulk Actions | Multi-select operations | ✅ Added |
| Product Price Variants | Multiple pricing tiers | ✅ Added |

---

## SECTION 11: UNIQUE FEATURES SUMMARY

**Features ONLY Helix Has (15 Total):**

1. ⚡ Long-Press Voice on ANY Text Input
2. ⚡ Smart Voice Parsing (auto-detect type/prospect/actions)
3. ⚡ CRM-Integrated Notes (two-way linking)
4. ⚡ CRM-Integrated Tasks
5. ⚡ CRM-Integrated Events
6. ⚡ Field-Sales Templates (Sample Drop, Site Visit, etc.)
7. ⚡ Orbital Screensaver UI
8. ⚡ 18 Email Templates × 3 Tones
9. ⚡ Mission System (72 guided tasks)
10. ⚡ Action Item Extraction (voice → task)
11. ⚡ Natural Language Date Parsing
12. ⚡ Crossroads Drag-Drop System
13. ⚡ Cascade Auto-Suggestions
14. ⚡ Single-File Architecture (offline-first, zero dependencies)
15. ⚡ Smart Contact Field (auto-show phone/email by task type)

---

## SECTION 12: PRIORITY FIXES FOR CLAUDE CODE

### P0 - Critical ✅ ALL COMPLETE
1. ~~Jobs module: Add Crossroads handlers~~ ✅ 10 handlers
2. ~~Jobs module: Add Cascade (Job → Invoice)~~ ✅ generateInvoiceFromJob()
3. ~~Invoices module: Add Crossroads handlers~~ ✅ 9 handlers
4. ~~All 5 Personals sub-modals: Build from stub to full~~ ✅ All 5 fully built

### P1 - High Priority
5. ~~Verify all Product/Service/Booking cascades work~~ ✅ All verified
6. ~~Add .ics calendar export~~ ✅ Already built (export single/all + import)
7. ~~Test delete functions across all modals (regression)~~ ✅

### P2 - Medium Priority
8. ~~Add remaining Personals Crossroads handlers~~ ✅ All wired
9. ~~Schedule conflict detection~~ ✅ Built (findEventConflicts + confirm dialog)
10. ~~CRM bulk actions~~ ✅ Built (select, status change, delete, CSV export)
11. Push notifications via Service Worker | Requires backend
12. ~~Geolocation features~~ ✅ Built (location toggle, nearby filter, note auto-tag, job check-in)

### P3 - Nice to Have
13. ~~PDF invoice export~~ ✅ Print-to-PDF implemented
14. ~~Product price variants~~ ✅ Built (label + price per tier)
15. Cloud sync (Supabase) - see Networking Spec
16. Booking Widget Mode B (cloud-connected)

---

*HELIX FEATURE LIST • v1.0 • March 2026*
*For Claude Code Implementation Reference*

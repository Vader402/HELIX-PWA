# HELIX COMPLETE FEATURE LIST
## For Claude Code: Audit, Fine-Tune, Add Missing
### Last Updated: March 12, 2026 (v58)

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
| Schedule | A- | Missing: Calendar sync |
| Notes | A | Complete |
| Connect (Email) | B+ | Missing: Tracking |
| Products | B+ | Needs cascade polish |
| Services | B+ | Needs cascade polish |
| Bookings | B+ | Needs cascade polish |
| Jobs | B | New - needs full wiring |
| Invoices | B | New - needs full wiring |
| Personals | C+ | Modals need building |
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
| Duplicate Detection | Warn on similar contacts | ⚠️ Verify |
| Import/Export | CSV import, JSON export | ✅ |
| Bulk Actions | Multi-select operations | ⚠️ Verify |

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
| Smart Contact Field | Show phone/email when type=call/email | ⚠️ Verify |
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
| Conflict Detection | Warn on overlapping events | ⚠️ Verify |

### Schedule Planned/Missing
| Feature | Description | Status |
|---------|-------------|--------|
| Google Calendar Sync | Two-way sync | ❌ Planned (use .ics instead) |
| .ics Export | Send calendar invites | ⚠️ Add |
| .ics Import | Receive calendar invites | ⚠️ Add |
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
| Price Variants | Multiple pricing tiers | ⚠️ Verify |
| Crossroads Integration | Drag to other modules | ⚠️ Verify handlers |
| Cascade Integration | Auto-actions on save | ⚠️ Verify |

### Services Module
| Feature | Description | Status |
|---------|-------------|--------|
| Service Catalog | Name, rate, duration, description | ✅ |
| Hourly/Flat Rates | Pricing options | ✅ |
| Time Tracking | Log billable hours | ✅ |
| Service → Job Flow | Create job from service | ⚠️ Verify cascade |
| Booking Configuration | Availability settings | ✅ |
| Public Booking Page | Embeddable widget | ✅ Mode A |
| Crossroads Integration | Drag to other modules | ⚠️ Verify handlers |

### Bookings Module
| Feature | Description | Status |
|---------|-------------|--------|
| Booking Requests | Inbound scheduling | ✅ |
| Booking → Event | Auto-create calendar event | ⚠️ Verify cascade |
| Booking → Prospect | Auto-create CRM entry | ⚠️ Verify cascade |
| Booking Status | Pending/Confirmed/Completed | ✅ |
| Availability Rules | Days, hours, buffer time | ✅ |

### Jobs Module
| Feature | Description | Status |
|---------|-------------|--------|
| Job Creation | Title, service, prospect | ✅ |
| Job Status | Not Started/In Progress/Complete | ✅ |
| Billable Flag | Mark as invoiceable | ✅ |
| Time Logging | Track hours on job | ⚠️ Verify |
| Job → Invoice Flow | Generate invoice from job | ⚠️ Verify cascade |
| Crossroads Integration | Drag to other modules | ❌ Missing handlers |
| Cascade Integration | Auto-actions on save | ❌ Missing |

### Invoices Module
| Feature | Description | Status |
|---------|-------------|--------|
| Invoice Creation | From job or manual | ✅ |
| Line Items | Multiple items per invoice | ✅ |
| Invoice Status | Draft/Sent/Paid/Overdue | ✅ |
| Due Dates | Payment deadlines | ✅ |
| Invoice → Payment Link | Stripe/PayPal integration | ⚠️ Planned |
| PDF Export | Downloadable invoice | ⚠️ Planned |
| Crossroads Integration | Drag to other modules | ❌ Missing handlers |
| Cascade Integration | Auto-actions on save | ❌ Missing |

---

## SECTION 7: PERSONALS MODULE

### People (Little Black Book)
| Feature | Description | Status |
|---------|-------------|--------|
| Personal Contacts | Non-business relationships | ✅ |
| Relationship Type | Friend, Family, Acquaintance | ✅ |
| Birthday Tracking | With reminders | ⚠️ Verify |
| Contact Frequency | "Haven't talked in X days" | ⚠️ Verify |
| Modal | Full card+wheel modal | ❌ Stub only |

### Cliques
| Feature | Description | Status |
|---------|-------------|--------|
| Friend Groups | College Crew, Work Friends, etc. | ✅ |
| Group Members | Link to People | ✅ |
| Group Events | Plan gatherings | ⚠️ Verify |
| Modal | Full card+wheel modal | ❌ Stub only |

### Places
| Feature | Description | Status |
|---------|-------------|--------|
| Favorite Locations | Restaurants, bars, venues | ✅ |
| Place Type | Restaurant, Bar, Park, etc. | ✅ |
| Recommendations | "Take Sarah here" | ⚠️ Verify |
| Modal | Full card+wheel modal | ❌ Stub only |

### Functions
| Feature | Description | Status |
|---------|-------------|--------|
| Event Planning | Parties, gatherings | ✅ |
| Planning Phases | Idea → Planning → Ready → Complete | ✅ |
| Invitees | Who's coming | ⚠️ Verify |
| Modal | Full card+wheel modal | ❌ Stub only |

### Romance
| Feature | Description | Status |
|---------|-------------|--------|
| Dating Tracker | People you're seeing | ✅ |
| Date History | Log of dates | ⚠️ Verify |
| Relationship Status | Dating → Exclusive → etc. | ⚠️ Verify |
| Modal | Full card+wheel modal | ❌ Stub only |

### Quests
| Feature | Description | Status |
|---------|-------------|--------|
| Personal Goals | Non-work challenges | ✅ |
| Milestones | Progress tracking | ⚠️ Verify |
| Accountability | Link to People | ⚠️ Verify |
| Modal | Full card+wheel modal | ❌ Stub only |

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
| Haptic Feedback | Vibration on actions | ⚠️ Verify |
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
| contact | ✅ | Verify handlers |
| product | ⚠️ | Needs verification |
| service | ⚠️ | Needs verification |
| booking | ⚠️ | Needs verification |
| job | ❌ | Missing handlers |
| invoice | ❌ | Missing handlers |
| clique | ❌ | Missing handlers |
| place | ❌ | Missing handlers |
| function | ❌ | Missing handlers |
| date (romance) | ❌ | Missing handlers |
| quest | ❌ | Missing handlers |
| person | ❌ | Missing handlers |

### Target Types (10)
| Target | Button | Status |
|--------|--------|--------|
| schedule | Ring button | ✅ |
| crm | Cyan button | ✅ |
| notes | Red button | ✅ |
| tasks | Purple button | ✅ |
| connect | Green button | ✅ |
| products | Orange button | ⚠️ |
| services | Green button | ⚠️ |
| bookings | Cyan button | ⚠️ |
| contacts | Pink button | ⚠️ |
| invoices | Gold button | ❌ |

---

## SECTION 10: CASCADE SYSTEM

### Established Cascades
| Trigger | Creates | Status |
|---------|---------|--------|
| Save Prospect | Suggest Task (follow-up) | ✅ |
| Save Event | Suggest Task (prep) | ✅ |
| Save Note | Suggest Task (action items) | ✅ |
| Complete Task | Update Prospect status | ✅ |
| Send Email | Log to Prospect history | ✅ |
| Service → Job | Create Job from Service | ⚠️ Verify |
| Job → Invoice | Create Invoice from Job | ⚠️ Verify |
| Booking → Event | Create Event from Booking | ⚠️ Verify |
| Booking → Prospect | Create Prospect from Booking | ⚠️ Verify |

### Missing Cascades
| Trigger | Should Create | Status |
|---------|---------------|--------|
| Job Complete | Suggest Invoice | ❌ |
| Invoice Sent | Update Job status | ❌ |
| Personals → Tasks | Reminder for contact | ❌ |
| Functions → Events | Event from Function | ❌ |
| Quests → Tasks | Tasks from milestones | ❌ |

---

## SECTION 11: UNIQUE FEATURES SUMMARY

**Features ONLY Helix Has (14 Total):**

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

---

## SECTION 12: PRIORITY FIXES FOR CLAUDE CODE

### P0 - Critical (Must Fix Before Launch)
1. Jobs module: Add Crossroads handlers
2. Jobs module: Add Cascade (Job → Invoice)
3. Invoices module: Add Crossroads handlers
4. All 5 Personals sub-modals: Build from stub to full

### P1 - High Priority
5. Verify all Product/Service/Booking cascades work
6. Add .ics calendar export
7. Test delete functions across all modals (regression)

### P2 - Medium Priority
8. Add remaining Personals Crossroads handlers
9. Push notifications via Service Worker
10. Geolocation features (proximity alerts)

### P3 - Nice to Have
11. PDF invoice export
12. Cloud sync (Supabase) - see Networking Spec
13. Booking Widget Mode B (cloud-connected)

---

*HELIX FEATURE LIST • v1.0 • March 2026*
*For Claude Code Implementation Reference*

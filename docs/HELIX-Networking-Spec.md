# HELIX NETWORKING & ONLINE FEATURES
## Claude Code Implementation Specification
### Document Version: 1.0 | March 12, 2026 | Post-Regression Phase

---

## OVERVIEW

Helix is currently a single-file, offline-first HTML application (~36,000+ lines) using localStorage for persistence. This document specifies the networking and online features planned for Phase 2, transforming Helix from a single-device tool to a connected platform while preserving its offline-first architecture.

**Core Principle:** Online features are ENHANCEMENTS, not requirements. Helix must always work without internet connectivity. Network features sync when available, degrade gracefully when not.

---

## FEATURE PRIORITY MATRIX

| Feature | Description | Priority | Complexity | Dependency |
|---------|-------------|----------|------------|------------|
| **Cloud Sync** | Cross-device data sync | P0 | High | Supabase |
| **User Auth** | Login/signup, session mgmt | P0 | Medium | Supabase Auth |
| **Booking Widget** | Public inbound scheduling | P1 | Medium | Cloud Sync |
| **Team Workspaces** | Shared data, permissions | P1 | High | Cloud Sync |
| **Plaid Integration** | Bank sync for SIMPL | P2 | High | Backend + Plaid API |
| **Push Notifications** | PWA + Web Push | P2 | Medium | Service Worker |
| **Calendar Export** | .ics file generation | P3 | Low | None |
| **Lead Marketplace** | Purchase curated leads | P3 | Very High | Backend + Data |

---

## SECTION 1: CLOUD SYNC (SUPABASE)

### 1.1 Architecture Philosophy

Helix uses a **localStorage-first, cloud-second** architecture. All data operations happen locally first, then sync to cloud when connected. This ensures zero-latency UX and full offline capability.

### Sync Strategy: Last-Write-Wins with Conflict Detection

- Each record has `updatedAt` timestamp (ISO 8601)
- On sync, compare local vs remote timestamps
- If conflict detected, prompt user: Keep Local / Keep Remote / Merge
- Deleted records use soft-delete with `deletedAt` timestamp

### 1.2 Supabase Schema

Each Helix module maps to a Supabase table. All tables share common audit fields:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | uuid | Primary key (generated client-side for offline support) |
| `user_id` | uuid | Foreign key to auth.users |
| `team_id` | uuid (nullable) | For team workspaces (null = personal) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last modification (sync conflict resolution) |
| `deleted_at` | timestamptz (nullable) | Soft delete marker |
| `sync_version` | integer | Increments on each sync (optimistic locking) |

### Module Tables

| Table | Helix Module | Key Fields (beyond common) |
|-------|--------------|---------------------------|
| `prospects` | CRM | name, email, phone, status, tags, history[] |
| `events` | Schedule | title, date, start, end, type, prospectId |
| `tasks` | Tasks | title, status, priority, dueDate, prospectId |
| `notes` | Notes | title, body, tags, color, prospectId |
| `templates` | Connect | name, subject, body, category, variants[] |
| `products` | Products | name, sku, price, stock, reorderPoint |
| `services` | Services | name, rate, duration, description |
| `bookings` | Bookings | serviceId, prospectId, date, status |
| `contacts` | Little Black Book | name, relationship, birthday, notes |
| `jobs` | Jobs | title, serviceId, prospectId, status, billable |
| `invoices` | Invoices | jobId, prospectId, amount, status, dueDate |

### 1.3 Sync Implementation

```javascript
async function syncModule(tableName, localData) {
  const lastSync = getLastSyncTime(tableName);
  
  // Get remote changes since last sync
  const remoteChanges = await supabase
    .from(tableName)
    .select('*')
    .gt('updated_at', lastSync);
  
  // Get local changes since last sync
  const localChanges = localData.filter(
    r => r.updatedAt > lastSync
  );
  
  // Detect conflicts, merge, push/pull
  const { toUpload, toDownload, conflicts } =
    resolveChanges(localChanges, remoteChanges);
  
  // Handle conflicts with user prompt if needed
  if (conflicts.length > 0) {
    await showConflictModal(conflicts);
  }
  
  // Push local changes
  await supabase.from(tableName).upsert(toUpload);
  
  // Pull remote changes to localStorage
  mergeIntoLocalStorage(tableName, toDownload);
  
  // Update sync timestamp
  setLastSyncTime(tableName, new Date().toISOString());
}
```

---

## SECTION 2: BOOKING WIDGET (INBOUND SCHEDULING)

### 2.1 Overview

The booking widget enables public inbound scheduling without OAuth dependencies. Helix users generate an embeddable booking page or link that prospects can use to request appointments.

### 2.2 Two Modes

**Mode A: Standalone HTML (Current - No Backend Required)**
- User configures availability in Helix
- Helix generates a self-contained HTML file
- File can be hosted anywhere (GitHub Pages, own domain)
- Booking requests sent via mailto: link (user receives email)
- No API, no backend, works today

**Mode B: Cloud-Connected (Requires Cloud Sync)**
- Booking page hosted at `helix.app/book/{userId}/{slug}`
- Real-time availability sync (no double-booking)
- Booking creates event directly in user's Helix
- Auto-creates prospect record in CRM
- Triggers Cascade: Booking → Event + Task (follow-up)

### 2.3 Booking Configuration Schema

| Field | Type | Description |
|-------|------|-------------|
| `serviceName` | string | Display name: "30-Minute Consultation" |
| `duration` | number | Minutes per slot: 15, 30, 45, 60 |
| `buffer` | number | Minutes between bookings (default 0) |
| `availableDays` | string[] | ['mon', 'tue', 'wed', 'thu', 'fri'] |
| `startTime` | string | First slot: '09:00' |
| `endTime` | string | Last slot end: '17:00' |
| `rate` | number | Price per session (0 = free) |
| `requireDeposit` | boolean | Require payment to confirm |
| `confirmationEmail` | string | Email template for confirmations |

---

## SECTION 3: TEAM WORKSPACES

### 3.1 Concept

Team Workspaces enable multiple Helix users to share data. This is a premium feature (Foolery tier) that requires Cloud Sync as a prerequisite.

### 3.2 Permission Model

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, billing, delete workspace, manage members |
| **Admin** | Full access, manage members (except owner) |
| **Member** | Create/edit own records, view team records |
| **Viewer** | Read-only access to team data |

### 3.3 Data Sharing Rules

- Each record has `visibility`: personal | team | both
- Personal records only sync to user's devices
- Team records sync to all workspace members
- Prospects can be "claimed" by a member (prevents duplicate outreach)
- Task assignment: Tasks can be assigned to specific team members

### 3.4 Internal Messaging (Foolery Feature)

Team members can send messages within Helix. Messages are simple text with optional record links (e.g., "Check out this prospect: [Prospect:abc123]").

---

## SECTION 4: PLAID INTEGRATION (SIMPL FINANCIAL)

### 4.1 Purpose

Plaid enables bank account connectivity for the SIMPL Financial Suite add-on. This powers automatic transaction import, P&L generation, expense categorization, and cash flow visualization.

### 4.2 Implementation Requirements

1. **Backend Required:** Plaid Link tokens must be generated server-side (cannot expose API keys in client)
2. **Plaid Link Integration:** Embed Plaid Link SDK for bank authentication
3. **Transaction Sync:** Use Plaid Transactions API to fetch transactions
4. **Categorization:** Auto-categorize using Plaid's category data, allow user override
5. **Security:** Access tokens stored encrypted server-side, never in localStorage

### 4.3 Data Flow

```
User clicks 'Connect Bank' in SIMPL
    ↓
Backend generates Plaid Link token
    ↓
Plaid Link opens, user authenticates
    ↓
Plaid returns public_token to client
    ↓
Client sends to backend, exchanges for access_token
    ↓
Backend stores encrypted access_token
    ↓
Cron job syncs transactions daily
```

---

## SECTION 5: CALENDAR & EMAIL INTEGRATION

### 5.1 The Helix Philosophy: No OAuth Dependencies

Helix intentionally avoids Google Calendar / Gmail API OAuth integration. This is a strategic decision:

- OAuth tokens expire and require refresh logic
- Creates dependency on Google's infrastructure
- Privacy concerns (Google sees all your events)
- API changes can break integration
- Monthly API costs at scale

### 5.2 Calendar: .ics Export/Import

**What field sales people actually do:**
- Send meeting invite = .ics attachment in email
- Receive meeting invite = import .ics into Helix

**Implementation:**
- **Export Event as .ics:** Tap event → "Send Invite" → generates .ics file
- **Import .ics:** Drag-drop or file picker → parses .ics → creates event in Helix
- **Subscribe via iCal URL:** User can export Helix calendar as iCal feed

### 5.3 Email: Option A+ (Lightweight + Smart)

1. Compose in Helix with templates and personalization
2. Open in email client via mailto: link OR copy to clipboard
3. One-click log: "I sent this" → updates prospect status + history
4. No OAuth, no API costs, no deliverability responsibility

---

## SECTION 6: GEOLOCATION FEATURES

### 6.1 Planned Capabilities

| Feature | Description |
|---------|-------------|
| **Prospect Proximity Alert** | "You are 0.3 miles from Pizzeria Lui" when near a CRM prospect |
| **Location-Based Tasks** | Task reminder triggers when you arrive at a location |
| **Auto-Tag Notes** | Notes auto-tagged with location where created |
| **Job Check-In** | Confirm arrival at job site, log start time |
| **Nearby Prospects Filter** | Filter CRM by distance: "Within 5 miles" |
| **Route Optimization** | Suggest optimal visit order for multiple prospects |

### 6.2 Privacy First

- Location is opt-in via Settings panel
- Location data stays in localStorage (not synced to cloud by default)
- User can toggle "Track location" per module
- Geofence alerts work via Service Worker (no server needed)

---

## SECTION 7: IMPLEMENTATION ORDER

Prerequisites must be completed before dependent features. This is the recommended build sequence:

| Phase | Feature | Prerequisites | Est. Time |
|-------|---------|---------------|-----------|
| 1 | Calendar .ics Export/Import | None | 4-6 hours |
| 2 | Supabase Auth + Schema | Supabase project setup | 1-2 days |
| 3 | Cloud Sync Engine | Phase 2 | 3-5 days |
| 4 | Booking Widget (Mode A) | None (standalone HTML) | 4-6 hours |
| 5 | Booking Widget (Mode B) | Phase 3 | 2-3 days |
| 6 | Team Workspaces | Phase 3 | 1-2 weeks |
| 7 | Geolocation Features | None | 2-3 days |
| 8 | Push Notifications | Service Worker | 1-2 days |
| 9 | Plaid Integration | Backend + Phase 3 | 1-2 weeks |
| 10 | Internal Messaging | Phase 6 | 3-5 days |

---

## SECTION 8: RECOMMENDED TECH STACK

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Auth + DB | Supabase | Postgres, realtime subscriptions, built-in auth, generous free tier |
| File Storage | Supabase Storage | Receipts, photos, exports - included with Supabase |
| Backend API | Supabase Edge Functions | Serverless, TypeScript, runs near user (low latency) |
| Banking | Plaid | Industry standard, broad bank coverage, good docs |
| Payments | Stripe | One-time payments, payment plans, subscription billing |
| Push | Web Push API | Native browser API, no third-party service needed |
| Maps/Geo | Browser Geolocation API | Free, native, no API key needed |

---

## KEY DESIGN DECISIONS

### 1. Why Supabase over Firebase?

- Open source (no vendor lock-in)
- SQL (Postgres) vs NoSQL - better for relational data
- Row-level security built-in
- Generous free tier
- Self-hostable if needed later

### 2. Why No Google Calendar OAuth?

- Complexity vs value ratio is poor
- .ics files accomplish the same goal with zero infrastructure
- Field sales people don't need "sync" - they need "send invite" and "import invite"
- Privacy: Google doesn't need to see our users' calendars

### 3. Why Soft Deletes?

- Sync requires knowing what was deleted remotely
- Enables "trash" feature (recover accidentally deleted items)
- Audit trail for compliance

### 4. Why Client-Generated UUIDs?

- Records can be created offline before any server contact
- No waiting for server round-trip for ID assignment
- Merge conflicts are identifiable by UUID collision (rare, handled gracefully)

---

*HELIX NETWORKING SPEC • V1.0 • MARCH 2026*
*For Claude Code Implementation*

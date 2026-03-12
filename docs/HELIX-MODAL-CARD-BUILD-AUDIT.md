# HELIX MODAL CARD BUILD AUDIT
## The Card+Wheel Pattern Specification
## For Claude Code — March 2026

---

# EXECUTIVE SUMMARY

Every Helix modal follows the **Card+Wheel Pattern**:
- **LEFT:** Live card preview being built (tap preview area to save)
- **RIGHT:** Vertical thumbwheel selector with amber frame
- **Field dots:** Show completion status (filled/active states)
- **Wheel onclick:** Tap-to-jump navigation

This document defines the pattern, audits all modals, and provides implementation templates.

---

# SECTION 1: THE CARD+WHEEL PATTERN

## 1.1 Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         MODAL (full screen)                     │
├───────────────────────────────────┬─────────────────────────────┤
│                                   │     WHEEL COLUMN (130px)    │
│         CARD COLUMN               │                             │
│                                   │  ┌─────────────────────┐    │
│  ┌─────────────────────────────┐  │  │ ░░░ baffle zone ░░░ │    │
│  │  ● Card Title               │  │  │ ░░░ Item 0 ░░░░░░░ │    │
│  │    meta line · status       │  │  ├─────────────────────┤    │
│  │                             │  │  ║ ═══ AMBER FRAME ═══ ║    │
│  │         TAP TO SAVE         │  │  ║   ★ ITEM 1 ★        ║    │
│  └─────────────────────────────┘  │  ║     (selected)      ║    │
│                                   │  ║ ═══════════════════ ║    │
│  ○ ● ○ ○ ○ ○  ← field dots       │  ├─────────────────────┤    │
│                                   │  │ ░░░ Item 2 ░░░░░░░ │    │
│  ┌─────────────────────────────┐  │  │ ░░░ baffle zone ░░░ │    │
│  │  ACTIVE FIELD EDITOR        │  │  └─────────────────────┘    │
│  │  (only current field shows) │  │                             │
│  └─────────────────────────────┘  │                             │
│                                   │                             │
└───────────────────────────────────┴─────────────────────────────┘
```

## 1.2 Core Behaviors

| Behavior | Description |
|----------|-------------|
| **Wheel scroll** | Scrolling changes active field, updates dots |
| **Wheel tap** | Tapping item jumps to that field |
| **Dot tap** | Tapping field dot navigates to that field |
| **Preview tap** | Tapping card preview area SAVES the item |
| **Field input** | Typing/selecting updates preview in real-time |
| **Ready state** | Card glows when required fields filled |

## 1.3 State Variables

Each modal tracks:
```javascript
window.[module]CurrentField = 0;  // Which field is active (0-indexed)
```

---

# SECTION 2: HTML TEMPLATE

## 2.1 Modal Container

```html
<div class="hx-modal" id="[module]Modal" style="--modal-accent:var(--[color]);--modal-glow:var(--[color]-glow)">
  <div class="hx-modal-header">
    <span class="hx-modal-title">[MODULE NAME]</span>
    <button class="hx-modal-close" onclick="close[Module]Modal()">✕</button>
  </div>
  
  <div class="hx-modal-body">
    <!-- LEFT: Card Column -->
    <div class="hx-card-column">
      <div class="hx-card" id="[module]Card" onclick="handle[Module]CardTap(event)">
        
        <!-- Preview Area - TAP TO SAVE -->
        <div class="hx-card-preview">
          <div class="hx-card-dot" id="[module]CardDot"></div>
          <div class="hx-card-info">
            <div class="hx-card-title" id="[module]CardTitle">New Item</div>
            <div class="hx-card-meta" id="[module]CardMeta">tap fields to build</div>
          </div>
          <div class="hx-card-save-hint" id="[module]SaveHint">TAP TO SAVE</div>
        </div>
        
        <!-- Field Completion Dots -->
        <div class="hx-card-fields" id="[module]CardFields">
          <span class="hx-field-dot" id="[module]Dot0" onclick="set[Module]Field(0)" title="Field 0"></span>
          <span class="hx-field-dot" id="[module]Dot1" onclick="set[Module]Field(1)" title="Field 1"></span>
          <span class="hx-field-dot" id="[module]Dot2" onclick="set[Module]Field(2)" title="Field 2"></span>
          <span class="hx-field-dot" id="[module]Dot3" onclick="set[Module]Field(3)" title="Field 3"></span>
          <span class="hx-field-dot" id="[module]Dot4" onclick="set[Module]Field(4)" title="Field 4"></span>
          <span class="hx-field-dot" id="[module]Dot5" onclick="set[Module]Field(5)" title="Field 5"></span>
        </div>
        
        <!-- Field Editor Area -->
        <div class="hx-card-editor">
          <!-- Field 0: Name/Title (visible by default) -->
          <div class="hx-field" id="[module]Field0">
            <div class="hx-field-label">NAME</div>
            <input type="text" class="hx-field-input" id="[module]NameInput" 
                   placeholder="Enter name..." oninput="update[Module]CardPreview()">
          </div>
          
          <!-- Field 1: Type (hidden by default) -->
          <div class="hx-field hidden" id="[module]Field1">
            <div class="hx-field-label">TYPE</div>
            <div class="hx-chip-row">
              <span class="hx-chip selected" data-val="type1" onclick="select[Module]Type('type1')">Type 1</span>
              <span class="hx-chip" data-val="type2" onclick="select[Module]Type('type2')">Type 2</span>
            </div>
            <input type="hidden" id="[module]TypeVal" value="type1">
          </div>
          
          <!-- Field 2-5: Additional fields... -->
          <div class="hx-field hidden" id="[module]Field2">...</div>
          <div class="hx-field hidden" id="[module]Field3">...</div>
          <div class="hx-field hidden" id="[module]Field4">...</div>
          <div class="hx-field hidden" id="[module]Field5">...</div>
        </div>
        
      </div>
    </div>
    
    <!-- RIGHT: Wheel Column -->
    <div class="hx-wheel-column">
      <div class="hx-wheel-overlay-top"></div>
      <div class="hx-wheel" id="[module]CatWheel">
        <div class="hx-wheel-spacer"></div>
        <div class="hx-wheel-item selected" data-cat="0" onclick="set[Module]Field(0)">Name</div>
        <div class="hx-wheel-item" data-cat="1" onclick="set[Module]Field(1)">Type</div>
        <div class="hx-wheel-item" data-cat="2" onclick="set[Module]Field(2)">Field 2</div>
        <div class="hx-wheel-item" data-cat="3" onclick="set[Module]Field(3)">Field 3</div>
        <div class="hx-wheel-item" data-cat="4" onclick="set[Module]Field(4)">Field 4</div>
        <div class="hx-wheel-item" data-cat="5" onclick="set[Module]Field(5)">Notes</div>
        <div class="hx-wheel-item save-item" data-cat="6" onclick="save[Module]()">✓ SAVE</div>
        <div class="hx-wheel-spacer"></div>
      </div>
      <div class="hx-wheel-overlay-bot"></div>
      <div class="hx-wheel-selector"></div>
    </div>
  </div>
  
  <!-- Delete button (edit mode only) -->
  <div class="hx-modal-footer" id="[module]DeleteRow" style="display:none">
    <button class="hx-delete-btn" onclick="delete[Module]()">Delete</button>
  </div>
  
  <!-- Cascade row (if applicable) -->
  <div class="hx-cascade-row" id="[module]CascadeRow" style="display:none">
    <button class="hx-cascade-btn" onclick="cascadeFrom[Module]()">
      Create Next Thing →
    </button>
  </div>
</div>
```

---

# SECTION 3: JAVASCRIPT TEMPLATE

## 3.1 State & Open/Close

```javascript
// Track current field
window.[module]CurrentField = 0;

// Open modal
function open[Module]Modal(id){
  const modal = document.getElementById('[module]Modal');
  const isEdit = !!id;
  
  // Reset state
  window.[module]CurrentField = 0;
  
  // Populate fields if editing
  if(isEdit){
    const item = (S.[modules] || []).find(x => x.id === id);
    if(item){
      document.getElementById('[module]Id').value = item.id;
      document.getElementById('[module]NameInput').value = item.name || '';
      document.getElementById('[module]TypeVal').value = item.type || 'type1';
      // ... populate other fields
      
      // Update type chips
      document.querySelectorAll('#[module]Field1 .hx-chip').forEach(c => {
        c.classList.toggle('selected', c.dataset.val === item.type);
      });
    }
    
    // Show delete button
    document.getElementById('[module]DeleteRow').style.display = 'flex';
    
    // Show cascade row if applicable
    const cascadeRow = document.getElementById('[module]CascadeRow');
    if(cascadeRow){
      cascadeRow.style.display = (item.status === 'complete') ? 'flex' : 'none';
    }
  } else {
    // New item - clear fields
    document.getElementById('[module]Id').value = '';
    document.getElementById('[module]NameInput').value = '';
    document.getElementById('[module]TypeVal').value = 'type1';
    // ... clear other fields
    
    // Reset chips
    document.querySelectorAll('#[module]Field1 .hx-chip').forEach((c, i) => {
      c.classList.toggle('selected', i === 0);
    });
    
    // Hide delete/cascade
    document.getElementById('[module]DeleteRow').style.display = 'none';
    document.getElementById('[module]CascadeRow').style.display = 'none';
  }
  
  // Show first field
  set[Module]Field(0);
  
  // Update preview
  update[Module]CardPreview();
  
  // Init wheel
  init[Module]CatWheel();
  
  // Open modal
  modal.classList.add('open');
  
  // Focus first input
  setTimeout(() => {
    document.getElementById('[module]NameInput')?.focus();
  }, 100);
}

// Close modal
function close[Module]Modal(){
  document.getElementById('[module]Modal').classList.remove('open');
}
```

## 3.2 Field Navigation

```javascript
// Set active field
function set[Module]Field(idx){
  window.[module]CurrentField = idx;
  
  // Toggle field visibility
  const fields = ['[module]Field0','[module]Field1','[module]Field2','[module]Field3','[module]Field4','[module]Field5'];
  fields.forEach((f, i) => {
    const el = document.getElementById(f);
    if(el) el.classList.toggle('hidden', i !== idx);
  });
  
  // Update wheel selection
  document.querySelectorAll('#[module]CatWheel .hx-wheel-item').forEach(item => {
    const cat = parseInt(item.dataset.cat);
    item.classList.toggle('selected', cat === idx);
    item.classList.toggle('in-frame', cat === idx);
  });
  
  // Scroll wheel to item (NO scrollIntoView!)
  scroll[Module]WheelTo(idx);
  
  // Update preview
  update[Module]CardPreview();
  
  // Haptic feedback
  if(typeof haptic === 'function') haptic('light');
}

// Scroll wheel to index (use scrollTop, NOT scrollIntoView)
function scroll[Module]WheelTo(idx){
  const wheel = document.getElementById('[module]CatWheel');
  if(!wheel) return;
  
  const itemHeight = 60;  // Match CSS
  const spacer = wheel.querySelector('.hx-wheel-spacer');
  const spacerHeight = spacer?.offsetHeight || 0;
  
  // Calculate scroll position to center item
  const targetScroll = spacerHeight + (idx * itemHeight) 
    - (wheel.offsetHeight / 2) + (itemHeight / 2);
  
  wheel.scrollTop = Math.max(0, targetScroll);
  
  // Update frame state after scroll
  setTimeout(() => update[Module]WheelFrame(), 50);
}

// Update which item is in frame
function update[Module]WheelFrame(){
  const wheel = document.getElementById('[module]CatWheel');
  if(!wheel) return;
  
  const items = wheel.querySelectorAll('.hx-wheel-item');
  const wheelRect = wheel.getBoundingClientRect();
  const centerY = wheelRect.top + wheelRect.height / 2;
  const frameHeight = 60;
  
  items.forEach(item => {
    const r = item.getBoundingClientRect();
    const itemCenter = r.top + r.height / 2;
    const inFrame = Math.abs(itemCenter - centerY) < frameHeight / 2;
    item.classList.toggle('in-frame', inFrame);
  });
}
```

## 3.3 Wheel Scroll Detection

```javascript
// Initialize wheel scroll listener
function init[Module]CatWheel(){
  const wheel = document.getElementById('[module]CatWheel');
  if(!wheel || wheel._scrollInitialized) return;
  wheel._scrollInitialized = true;
  
  let scrollTimeout;
  wheel.addEventListener('scroll', () => {
    // Update frame state immediately
    update[Module]WheelFrame();
    
    // Debounced field selection
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const items = wheel.querySelectorAll('.hx-wheel-item[data-cat]');
      const rect = wheel.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      let closest = null;
      let closestDist = Infinity;
      
      items.forEach(item => {
        const r = item.getBoundingClientRect();
        const dist = Math.abs((r.top + r.height / 2) - centerY);
        if(dist < closestDist){
          closestDist = dist;
          closest = item;
        }
      });
      
      if(closest){
        const idx = parseInt(closest.dataset.cat);
        if(!isNaN(idx) && idx !== window.[module]CurrentField){
          set[Module]Field(idx);
        }
      }
    }, 150);
  }, {passive: true});
}
```

## 3.4 Card Preview Update

```javascript
// Update card preview and field dots
function update[Module]CardPreview(){
  // Get field values
  const name = document.getElementById('[module]NameInput').value.trim();
  const type = document.getElementById('[module]TypeVal').value;
  const field2 = document.getElementById('[module]Field2Input')?.value.trim() || '';
  const field3 = document.getElementById('[module]Field3Input')?.value.trim() || '';
  const field4 = document.getElementById('[module]Field4Input')?.value.trim() || '';
  const notes = document.getElementById('[module]NotesInput')?.value.trim() || '';
  
  // Update preview text
  document.getElementById('[module]CardTitle').textContent = name || 'New Item';
  document.getElementById('[module]CardMeta').textContent = type + (field2 ? ' · ' + field2 : '');
  
  // Update field dots
  const currentField = window.[module]CurrentField || 0;
  setDot('[module]Dot0', !!name, currentField === 0);
  setDot('[module]Dot1', type !== 'type1', currentField === 1);  // non-default
  setDot('[module]Dot2', !!field2, currentField === 2);
  setDot('[module]Dot3', !!field3, currentField === 3);
  setDot('[module]Dot4', !!field4, currentField === 4);
  setDot('[module]Dot5', !!notes, currentField === 5);
  
  // Ready state - glow when required fields filled
  const card = document.getElementById('[module]Card');
  const hint = document.getElementById('[module]SaveHint');
  const isReady = !!name;  // Add more required field checks
  card.classList.toggle('ready', isReady);
  if(hint) hint.classList.toggle('visible', isReady);
}

// Helper: set dot filled/active state
function setDot(dotId, filled, active){
  const dot = document.getElementById(dotId);
  if(!dot) return;
  dot.classList.toggle('filled', filled);
  dot.classList.toggle('active', active);
}
```

## 3.5 Card Tap Handler

```javascript
// Handle card tap - save only on preview area
function handle[Module]CardTap(e){
  // Ignore taps on inputs/chips
  if(e.target.tagName === 'INPUT' || 
     e.target.tagName === 'SELECT' || 
     e.target.tagName === 'TEXTAREA' || 
     e.target.classList.contains('hx-chip')){
    return;
  }
  
  const name = document.getElementById('[module]NameInput').value.trim();
  
  // If required field empty, focus it
  if(!name){
    set[Module]Field(0);
    document.getElementById('[module]NameInput').focus();
    toast('Enter name first');
    return;
  }
  
  // If tapping preview area, save
  const preview = document.getElementById('[module]Card').querySelector('.hx-card-preview');
  if(preview && preview.contains(e.target)){
    save[Module]();
    return;
  }
  
  // If tapping field dot, navigate
  if(e.target.classList.contains('hx-field-dot')){
    const idx = parseInt(e.target.id.replace('[module]Dot', ''));
    if(!isNaN(idx)) set[Module]Field(idx);
  }
}
```

## 3.6 Save/Delete

```javascript
// Save item
function save[Module](){
  const id = document.getElementById('[module]Id').value;
  const name = document.getElementById('[module]NameInput').value.trim();
  
  if(!name){
    toast('Name required');
    return;
  }
  
  S.[modules] = S.[modules] || [];
  
  if(id){
    // Update existing
    const item = S.[modules].find(x => x.id === id);
    if(item){
      item.name = name;
      item.type = document.getElementById('[module]TypeVal').value;
      // ... update other fields
      item.updated = new Date().toISOString();
    }
  } else {
    // Create new
    S.[modules].push({
      id: uid(),
      name: name,
      type: document.getElementById('[module]TypeVal').value,
      // ... other fields
      created: new Date().toISOString()
    });
  }
  
  save();
  close[Module]Modal();
  render[Modules]();
  toast('✓ ' + (id ? 'Updated' : 'Created'));
}

// Delete item
function delete[Module](){
  const id = document.getElementById('[module]Id').value;
  if(!id) return;
  
  if(!confirm('Delete this item?')) return;
  
  S.[modules] = (S.[modules] || []).filter(x => x.id !== id);
  save();
  close[Module]Modal();
  render[Modules]();
  toast('Deleted');
}
```

---

# SECTION 4: CSS REFERENCE

## 4.1 Modal Structure

```css
.hx-modal {
  position: fixed;
  inset: 0;
  background: var(--black);
  z-index: 1000;
  display: none;
  flex-direction: column;
}

.hx-modal.open {
  display: flex;
}

.hx-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--gray-faint);
}

.hx-modal-title {
  font-family: Oswald;
  font-size: 18px;
  color: var(--modal-accent);
  text-shadow: 0 0 20px var(--modal-glow);
}

.hx-modal-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.hx-card-column {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.hx-wheel-column {
  width: 130px;
  position: relative;
  background: var(--black);
  border-left: 1px solid var(--gray-faint);
}
```

## 4.2 Card Preview

```css
.hx-card {
  background: var(--glass);
  border: 1px solid var(--gray-faint);
  border-radius: 12px;
  overflow: hidden;
}

.hx-card.ready {
  border-color: var(--modal-accent);
  box-shadow: 0 0 20px var(--modal-glow);
}

.hx-card-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
}

.hx-card-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--gray-mid);
  flex-shrink: 0;
}

.hx-card.ready .hx-card-dot {
  background: var(--modal-accent);
  box-shadow: 0 0 10px var(--modal-glow);
  animation: pulse 2s infinite;
}

.hx-card-info {
  flex: 1;
  min-width: 0;
}

.hx-card-title {
  font-family: Oswald;
  font-size: 16px;
  color: var(--white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hx-card-meta {
  font-size: 12px;
  color: var(--gray-light);
}

.hx-card-save-hint {
  font-family: Oswald;
  font-size: 11px;
  color: var(--modal-accent);
  opacity: 0;
  transition: opacity 0.2s;
}

.hx-card-save-hint.visible {
  opacity: 1;
}
```

## 4.3 Field Dots

```css
.hx-card-fields {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  border-top: 1px solid var(--gray-faint);
  background: rgba(0,0,0,0.2);
}

.hx-field-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gray-faint);
  cursor: pointer;
  transition: all 0.2s;
}

.hx-field-dot.filled {
  background: var(--modal-accent);
  box-shadow: 0 0 6px var(--modal-glow);
}

.hx-field-dot.active {
  transform: scale(1.3);
  border: 2px solid var(--modal-accent);
  background: transparent;
}
```

## 4.4 Wheel (see Thumbwheel Spec for full details)

```css
.hx-wheel {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.hx-wheel-item {
  height: 60px;
  scroll-snap-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
  opacity: 0.25;
  transform: scale(0.9);
  transition: all 0.15s;
}

.hx-wheel-item.in-frame {
  opacity: 1;
  transform: scale(1);
}

.hx-wheel-selector {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  height: 60px;
  border: 3px solid var(--amber);
  border-radius: 12px;
  pointer-events: none;
  z-index: 10;
  box-shadow:
    0 0 15px var(--amber),
    0 0 30px var(--amber-glow),
    inset 0 0 15px rgba(245,158,11,0.1);
}
```

---

# SECTION 5: MODAL AUDIT STATUS

## 5.1 Layer 1 Modals (Core 5)

| Modal | Card+Wheel | Field Dots | currentField | handleCardTap | Wheel onclick | Status |
|-------|------------|------------|--------------|---------------|---------------|--------|
| evtModal | ✅ | ✅ 6 dots | ✅ | ✅ | ✅ | COMPLETE |
| noteModal | ✅ | ✅ 5 dots | ✅ | ✅ | ✅ | COMPLETE |
| taskModal | ✅ | ✅ 6 dots | ✅ | ✅ | ✅ | COMPLETE |
| prospectModal | ✅ | ✅ 6 dots | ✅ | ✅ | ✅ | COMPLETE |
| outreachModal | ✅ | ⚠️ Partial | ⚠️ | ⚠️ | ⚠️ | NEEDS AUDIT |

## 5.2 Layer 2 Modals (Business)

| Modal | Card+Wheel | Field Dots | currentField | handleCardTap | Wheel onclick | Status |
|-------|------------|------------|--------------|---------------|---------------|--------|
| contactModal | ✅ | ✅ 6 dots | ✅ | ✅ | ✅ | COMPLETE |
| productModal | ✅ | ✅ 5 dots | ✅ | ✅ | ✅ | COMPLETE |
| serviceModal | ✅ | ✅ 4 dots | ✅ | ✅ | ✅ | COMPLETE |
| bookingModal | ✅ | ✅ 5 dots | ✅ | ✅ | ✅ | COMPLETE |

## 5.3 Business Suite Modals

| Modal | Card+Wheel | Field Dots | currentField | handleCardTap | Wheel onclick | Status |
|-------|------------|------------|--------------|---------------|---------------|--------|
| jobModal | ✅ | ⚠️ Verify | ⚠️ Verify | ⚠️ Verify | ⚠️ Verify | NEEDS AUDIT |
| invoiceModal | ✅ | ⚠️ Verify | ⚠️ Verify | ⚠️ Verify | ⚠️ Verify | NEEDS AUDIT |

## 5.4 Personals Modals (NOT BUILT)

| Modal | Card+Wheel | Field Dots | currentField | handleCardTap | Wheel onclick | Status |
|-------|------------|------------|--------------|---------------|---------------|--------|
| cliqueModal | ❌ | ❌ | ❌ | ❌ | ❌ | STUB ONLY |
| placeModal | ❌ | ❌ | ❌ | ❌ | ❌ | STUB ONLY |
| functionModal | ❌ | ❌ | ❌ | ❌ | ❌ | STUB ONLY |
| dateModal | ❌ | ❌ | ❌ | ❌ | ❌ | STUB ONLY |
| questModal | ❌ | ❌ | ❌ | ❌ | ❌ | STUB ONLY |

---

# SECTION 6: WHEEL FIELD SPECS PER MODAL

## 6.1 Existing Modals

| Modal | Field 0 | Field 1 | Field 2 | Field 3 | Field 4 | Field 5 | SAVE |
|-------|---------|---------|---------|---------|---------|---------|------|
| task | Title | Type | Priority | Due | Link | Notes | ✓ |
| evt | Title | Type | Time | Link | Remind | Notes | ✓ |
| note | Title | Type | Body | Tags | Link | — | ✓ |
| prospect | Business | Contact | Type | Status | Follow-up | Notes | ✓ |
| contact | Name | Contact | Birthday | Relation | Reminders | Notes | ✓ |
| product | Name | Price | Stock | Unit | Category | — | ✓ |
| service | Name | Rate | Duration | Description | — | — | ✓ |
| booking | Client | Service | Date | Time | Notes | — | ✓ |
| job | Title | Client | Service | Status | Time | Notes | ✓ |
| invoice | Number | Client | Items | Terms | Due | Notes | ✓ |

## 6.2 Personals Modals (To Build)

| Modal | Field 0 | Field 1 | Field 2 | Field 3 | Field 4 | Field 5 | SAVE |
|-------|---------|---------|---------|---------|---------|---------|------|
| clique | Name | Emoji | Members | Frequency | Notes | — | ✓ |
| place | Name | Address | Category | Rating | Notes | — | ✓ |
| function | Name | When | Where | Type | Guests | Notes | ✓ |
| date | Type | Date | With | Location | Notes | — | ✓ |
| quest | Name | Category | Deadline | Progress | Partner | Notes | ✓ |

---

# SECTION 7: TESTING CHECKLIST

## Per-Modal Test Protocol

```
□ TAP + BUTTON
  → Modal opens
  → First field (Name) is focused
  → Wheel shows first item in frame
  → All field dots are empty (not filled)
  → Card preview shows "New Item"

□ ENTER NAME
  → Field dot 0 fills (glows)
  → Card preview updates with name
  → "TAP TO SAVE" hint appears
  → Card border glows (ready state)

□ SCROLL WHEEL
  → Active field changes
  → Previous field hides, new field shows
  → Field dots update (active ring moves)
  → Wheel item highlights in frame

□ TAP WHEEL ITEM
  → Jumps directly to that field
  → Wheel scrolls to center that item
  → Field visibility updates

□ TAP FIELD DOT
  → Jumps to that field
  → Same behavior as wheel tap

□ FILL MULTIPLE FIELDS
  → Each filled field's dot glows
  → Card preview shows combined info
  → Meta line updates

□ TAP CARD PREVIEW
  → Item saves
  → Modal closes
  → Toast confirms
  → Panel re-renders with new item

□ EDIT EXISTING ITEM
  → Modal opens with data populated
  → Field dots show filled state correctly
  → Delete button visible
  → Changes save on preview tap

□ DELETE ITEM
  → Confirm dialog appears
  → On confirm: item deleted, modal closes
  → Panel re-renders without item
```

---

# SECTION 8: ANTI-PATTERNS

## ❌ DON'T

```javascript
// DON'T use scrollIntoView — breaks parent containers
targetItem.scrollIntoView({behavior:'smooth', block:'center'});

// DON'T save on any card tap — only preview area
function handleCardTap(e){
  saveItem();  // WRONG - fires on input taps too
}

// DON'T forget to check e.target
function handleCardTap(e){
  // Missing: if(e.target.tagName === 'INPUT') return;
  saveItem();
}

// DON'T use multiple currentField variables
let currentField = 0;  // Local variable gets lost
// USE: window.[module]CurrentField = 0;

// DON'T skip the init check
function initCatWheel(){
  wheel.addEventListener('scroll', ...);  // Adds duplicate listeners!
}
// USE: if(wheel._scrollInitialized) return;
```

## ✅ DO

```javascript
// DO use scrollTop calculations
const targetScroll = spacerHeight + (idx * itemHeight) - (wheel.offsetHeight / 2) + (itemHeight / 2);
wheel.scrollTop = Math.max(0, targetScroll);

// DO check e.target before processing
function handleCardTap(e){
  if(e.target.tagName === 'INPUT') return;
  if(e.target.classList.contains('hx-chip')) return;
  // ... then process
}

// DO save only on preview tap
const preview = card.querySelector('.hx-card-preview');
if(preview && preview.contains(e.target)){
  saveItem();
}

// DO use window-scoped currentField
window.taskCurrentField = idx;

// DO prevent duplicate init
if(wheel._scrollInitialized) return;
wheel._scrollInitialized = true;
```

---

# SECTION 9: BUILD ORDER FOR PERSONALS

```
1. BUILD cliqueModal (template for others)
   - Copy taskModal structure
   - Change field IDs to clique*
   - Change color to --magenta
   - Implement 5 fields: Name, Emoji, Members, Frequency, Notes
   - Wire save/delete
   - Test fully before proceeding

2. BUILD placeModal
   - Copy cliqueModal structure
   - Change to --teal
   - Fields: Name, Address, Category, Rating, Notes

3. BUILD functionModal
   - Copy structure
   - Change to --indigo
   - Fields: Name, When, Where, Type, Guests, Notes
   - Add place picker for "Where"
   - Add clique multi-select for "Guests"

4. BUILD dateModal
   - Copy structure
   - Change to --rose
   - Fields: Type, Date, With, Location, Notes
   - Add contact picker for "With"
   - Add place picker for "Location"

5. BUILD questModal
   - Copy structure
   - Change to --amber
   - Fields: Name, Category, Deadline, Progress, Partner, Notes
   - Add progress slider (0-100)
   - Add contact picker for "Partner"
```

---

*HELIX MODAL CARD BUILD AUDIT*
*Document Version: 1.0*
*Created: March 12, 2026*
*For: Claude Code Handoff*

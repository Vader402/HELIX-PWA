# HELIX THUMBWHEEL SELECTOR
## V3OG Design System Component Specification
### For Helix Banking Integration

---

## 1. Overview

The Helix Thumbwheel is a scrolling selector with a fixed viewfinder frame. Items scroll through the wheel; the amber tubular frame illuminates what's centered. This creates a "peering through fog" effect where distant items fade into darkness and the selected item glows with the signature amber beam.

### Design Philosophy

The wheel embodies the V3OG "glow from within" principle. The amber selector frame is not a flat border but a tubular neon ring with layered glow effects. Items outside the frame are baffled (dimmed and scaled), creating depth and focus on the current selection.

---

## 2. Visual Structure

### Vertical Thumbwheel (Primary)

Used for: Contact/prospect selection, category navigation, any vertical picker

```
        ┌───────────┐
        │░░░░░░░░░░░│  ← BAFFLE ZONE: opacity 0.25, scale 0.9
        │░░ Item 1 ░│     gradient overlay fades to black
        ├───────────┤
   ═════╬═══════════╬═════  ← AMBER TUBULAR FRAME (70px)
        ║ ✦ ITEM 2 ✦║        ← ILLUMINATED: opacity 1, scale 1
        ║ ✦  meta  ✦║          text-shadow GLOWS
   ═════╬═══════════╬═════     icon gets drop-shadow
        ├───────────┤
        │░░░░░░░░░░░│  ← BAFFLE ZONE
        │░░ Item 3 ░│
        └───────────┘
```

---

## 3. Measurements

### Vertical Wheel (Dashboard)

| Property | Value |
|----------|-------|
| Container width | **130px** |
| Frame height | **70px** |
| Item height | **70px** (must match frame) |
| Frame border | **3px solid var(--amber)** |
| Frame border-radius | **12px** |
| Spacer height | calc(50% - 35px) |

### Modal Wheel (Compact)

| Property | Value |
|----------|-------|
| Container width | **100px** |
| Frame/item height | **60px** |
| Class prefix | `.hx-wheel-*` |

---

## 4. CSS Specifications

### 4.1 Container

```css
.wheel-side {
  width: 130px;
  position: relative;
  overflow: hidden;
  background: var(--black);
  border-left: 1px solid var(--gray-faint);
}

.wheel-vertical {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.wheel-vertical::-webkit-scrollbar { display: none; }
```

### 4.2 Items (Baffle Default)

```css
.wheel-item {
  height: 70px;
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
  opacity: 0.25;                    /* BAFFLE */
  transform: scale(0.9);            /* BAFFLE */
  transition: all 0.15s ease-out;
}
```

### 4.3 In-Frame State (Illuminated)

```css
.wheel-item.in-frame {
  opacity: 1;
  transform: scale(1);
}

.wheel-item.in-frame svg {
  stroke: var(--amber);
  filter: drop-shadow(0 0 6px var(--amber-glow));
}

.wheel-item.in-frame .item-name {
  color: var(--amber);
  text-shadow: 0 0 8px var(--amber-glow);
}

.wheel-item.in-frame .item-meta {
  color: var(--amber);
}
```

### 4.4 Selected State (Maximum Beam)

```css
.wheel-item.selected {
  opacity: 1;
  transform: scale(1.05);
}

.wheel-item.selected svg {
  filter: 
    drop-shadow(0 0 10px var(--amber)) 
    drop-shadow(0 0 20px var(--amber-glow));
}

.wheel-item.selected .item-name {
  text-shadow:
    0 0 10px var(--amber),
    0 0 20px var(--amber-glow),
    0 0 30px var(--amber-glow);
}
```

---

## 5. The Amber Selector Frame

**This is the signature element — a tubular neon frame with layered glow effects.**

```css
.wheel-selector {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  height: 70px;
  border: 3px solid var(--amber);
  border-radius: 12px;
  pointer-events: none;
  z-index: 10;
  
  /* LAYERED GLOW - THE MAGIC */
  box-shadow:
    0 0 15px var(--amber),           /* tight glow */
    0 0 30px var(--amber-glow),      /* medium glow */
    0 0 50px rgba(245,158,11,0.25),  /* wide ambient */
    inset 0 0 15px rgba(245,158,11,0.1);  /* inner glow */
  
  /* INTERIOR GRADIENT */
  background: linear-gradient(180deg,
    rgba(245,158,11,0.08) 0%,
    transparent 30%,
    transparent 70%,
    rgba(245,158,11,0.05) 100%);
}
```

### 5.1 Tubular Highlight (::before)

Creates the shiny edge reflection on the tubular frame:

```css
.wheel-selector::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 14px;
  border: 3px solid transparent;
  background: linear-gradient(180deg,
    rgba(255,220,150,0.4),
    transparent 40%,
    transparent 60%,
    rgba(255,220,150,0.2)) border-box;
  -webkit-mask: 
    linear-gradient(#fff 0 0) padding-box, 
    linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

---

## 6. Baffle Overlays

The baffle creates the "peering through fog" effect. Items fade as they move away from center via gradient overlays.

```css
.wheel-overlay-top,
.wheel-overlay-bot {
  position: absolute;
  left: 0; right: 0;
  pointer-events: none;
  z-index: 8;
}

.wheel-overlay-top {
  top: 0;
  height: calc(50% - 35px);
  background: linear-gradient(180deg,
    rgba(10,10,10,0.98) 0%,
    rgba(10,10,10,0.9) 50%,
    rgba(10,10,10,0.6) 80%,
    transparent 100%);
}

.wheel-overlay-bot {
  bottom: 0;
  height: calc(50% - 35px);
  background: linear-gradient(0deg,
    rgba(10,10,10,0.98) 0%,
    rgba(10,10,10,0.9) 50%,
    rgba(10,10,10,0.6) 80%,
    transparent 100%);
}
```

---

## 7. JavaScript: Frame Detection

**CRITICAL: Use scrollTop calculations, NOT scrollIntoView() which can displace parent containers.**

### 7.1 Update Frame State

```javascript
function updateWheelFrame() {
  const wheel = document.getElementById('prospectWheel');
  if (!wheel) return;
  
  const items = wheel.querySelectorAll('.wheel-item');
  const wheelRect = wheel.getBoundingClientRect();
  const centerY = wheelRect.top + wheelRect.height / 2;
  const frameHeight = 70;

  items.forEach(item => {
    const r = item.getBoundingClientRect();
    const itemCenter = r.top + r.height / 2;
    const inFrame = Math.abs(itemCenter - centerY) < frameHeight / 2;
    item.classList.toggle('in-frame', inFrame);
  });
}
```

### 7.2 Scroll To Item (No scrollIntoView)

```javascript
function scrollWheelTo(catIndex) {
  const wheel = document.getElementById('catWheel');
  if (!wheel) return;

  const itemHeight = 60;
  const spacer = wheel.querySelector('.wheel-spacer');
  const spacerHeight = spacer?.offsetHeight || 0;

  // Calculate scroll position to center item
  const targetScroll = spacerHeight + (catIndex * itemHeight)
    - (wheel.offsetHeight / 2) + (itemHeight / 2);

  wheel.scrollTop = Math.max(0, targetScroll);
  setTimeout(() => updateWheelFrame(), 50);
}
```

### 7.3 Scroll Listener with Debounced Selection

```javascript
let scrollTimeout;
wheel.addEventListener('scroll', () => {
  updateWheelFrame(); // Immediate visual update
  
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    // Find item in frame and select it
    const inFrame = wheel.querySelector('.in-frame');
    if (inFrame) {
      selectItem(inFrame.dataset.id || inFrame.dataset.value);
    }
  }, 150); // Debounce selection
});
```

---

## 8. HTML Structure

```html
<div class="wheel-side">
  <div class="wheel-overlay-top"></div>
  <div class="wheel-vertical" id="prospectWheel">
    <div class="wheel-spacer"></div>
    <!-- Items rendered by JS -->
    <div class="wheel-spacer"></div>
  </div>
  <div class="wheel-overlay-bot"></div>
  <div class="wheel-selector"></div>
</div>
```

---

## 9. Color Variables

| Variable | Hex | Usage |
|----------|-----|-------|
| `--amber` | #F59E0B | Frame border, selected text |
| `--amber-glow` | #FF8C00 | Box-shadow, text-shadow |
| `--black` | #0A0A0A | Container background |
| `--gray-faint` | #2A2A2A | Borders, dividers |
| `--gray-mid` | #444444 | Item backgrounds |
| `--gray-light` | #999999 | Dormant text, icons |

---

## 10. Lighting Effect Summary

| Element | Effect | CSS Property |
|---------|--------|--------------|
| Frame border | Solid amber tube | `border: 3px solid var(--amber)` |
| Frame outer glow | Multi-layer bloom | `box-shadow: 0 0 15px, 0 0 30px, 0 0 50px` |
| Frame inner glow | Subtle ambiance | `inset 0 0 15px rgba(245,158,11,0.1)` |
| Frame highlight | Tubular shine | `::before` with gradient + mask |
| Frame interior | Light gradient | `background: linear-gradient(...)` |
| Item text glow | Neon text | `text-shadow: 0 0 10px, 0 0 20px` |
| Item icon glow | Neon icon | `filter: drop-shadow(0 0 6px) drop-shadow(0 0 12px)` |
| Baffle fade | Fog effect | Gradient overlays + item opacity 0.25 |

---

## 11. Horizontal Thumbwheel (Variant)

Used for: Template selector, tone picker, any horizontal picker

### Measurements
- Container height: **60px**
- Frame width: **100px**
- Item width: **100px** (matches frame)

### CSS

```css
.wheel-horizontal-container {
  position: relative;
  height: 60px;
  overflow: hidden;
  background: var(--black);
}

.wheel-horizontal {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  height: 100%;
  padding: 0 calc(50% - 50px); /* Center first/last items */
}

.wheel-horizontal::-webkit-scrollbar { display: none; }

.wheel-h-item {
  flex-shrink: 0;
  width: 100px;
  scroll-snap-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.25;
  transition: all 0.15s ease-out;
}

.wheel-h-item.in-frame {
  opacity: 1;
}

.wheel-h-selector {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0; bottom: 0;
  width: 100px;
  border: 3px solid var(--amber);
  border-radius: 30px;
  pointer-events: none;
  z-index: 10;
  box-shadow:
    0 0 20px var(--amber-glow),
    0 0 40px var(--amber-glow),
    inset 0 0 15px rgba(245,158,11,0.1);
}

.wheel-h-overlay-left {
  position: absolute;
  left: 0;
  top: 0; bottom: 0;
  width: calc(50% - 50px);
  background: linear-gradient(90deg,
    rgba(10,10,10,0.98) 0%,
    rgba(10,10,10,0.9) 50%,
    rgba(10,10,10,0.6) 80%,
    transparent 100%);
  pointer-events: none;
  z-index: 8;
}

.wheel-h-overlay-right {
  position: absolute;
  right: 0;
  top: 0; bottom: 0;
  width: calc(50% - 50px);
  background: linear-gradient(270deg,
    rgba(10,10,10,0.98) 0%,
    rgba(10,10,10,0.9) 50%,
    rgba(10,10,10,0.6) 80%,
    transparent 100%);
  pointer-events: none;
  z-index: 8;
}
```

### Horizontal Frame Detection

```javascript
function updateHorizontalWheelFrame(wheelId) {
  const wheel = document.getElementById(wheelId);
  const items = wheel.querySelectorAll('.wheel-h-item');
  const wheelRect = wheel.getBoundingClientRect();
  const centerX = wheelRect.left + wheelRect.width / 2;
  const frameWidth = 100;

  items.forEach(item => {
    const r = item.getBoundingClientRect();
    const itemCenter = r.left + r.width / 2;
    const inFrame = Math.abs(itemCenter - centerX) < frameWidth / 2;
    item.classList.toggle('in-frame', inFrame);
  });
}
```

---

## Key Learnings & Anti-Patterns

### ✅ DO
- Use `scrollTop` calculations to scroll items into frame
- Match item height to frame height exactly
- Include spacers at top/bottom equal to `calc(50% - frameHeight/2)`
- Use `scroll-snap-type: y mandatory` and `scroll-snap-align: center`
- Debounce selection (150ms) after scroll stops

### ❌ DON'T
- Use `scrollIntoView()` — it displaces parent containers
- Forget the `::before` tubular highlight — it's key to the V3OG look
- Use single-layer box-shadow — layer 3-4 for proper glow
- Skip the baffle overlays — they create the depth effect

---

*HELIX DESIGN SYSTEM • V3OG AESTHETIC*
*Component Spec for Banking Integration*

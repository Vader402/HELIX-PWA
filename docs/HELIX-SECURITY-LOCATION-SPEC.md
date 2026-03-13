# HELIX SECURITY & LOCATION SUITE
## Comprehensive Security and Geolocation Specification
## For Claude Code — March 2026

---

# EXECUTIVE SUMMARY

Helix requires three security/location layers:

1. **App Access Security** — Biometric (Face ID, fingerprint) or PIN lock
2. **Data Protection** — Encryption for sensitive modules
3. **Geolocation Features** — Auto-tagging, nearby filters, check-ins

All features use native Web APIs — no external dependencies.

---

# SECTION 1: APP ACCESS SECURITY

## 1.1 Lock Screen UI

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│            ┌───────────┐                │
│            │   HELIX   │                │
│            │    ◉◉◉    │                │
│            └───────────┘                │
│                                         │
│         Enter PIN to unlock             │
│                                         │
│        ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│        │ ● │ │ ● │ │ ○ │ │ ○ │        │
│        └───┘ └───┘ └───┘ └───┘        │
│                                         │
│     ┌───┐   ┌───┐   ┌───┐             │
│     │ 1 │   │ 2 │   │ 3 │             │
│     └───┘   └───┘   └───┘             │
│     ┌───┐   ┌───┐   ┌───┐             │
│     │ 4 │   │ 5 │   │ 6 │             │
│     └───┘   └───┘   └───┘             │
│     ┌───┐   ┌───┐   ┌───┐             │
│     │ 7 │   │ 8 │   │ 9 │             │
│     └───┘   └───┘   └───┘             │
│            ┌───┐   ┌───┐               │
│            │ 0 │   │ ⌫ │               │
│            └───┘   └───┘               │
│                                         │
│    ┌─────────────────────────────┐     │
│    │    🔐 Use Face ID / Touch   │     │
│    └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

## 1.2 PIN System

### Data Model

```javascript
// Stored in localStorage (separate from S object)
const helixSecurity = {
  enabled: true,
  method: 'pin',           // 'pin' | 'biometric' | 'both'
  pinHash: 'sha256...',    // Never store plain PIN
  pinSalt: 'random...',
  autoLockMinutes: 5,      // 1, 5, 15, 30, 0 (never)
  lastActivity: Date.now(),
  failedAttempts: 0,
  lockoutUntil: null,
  
  // Module gating
  gateInvoices: true,
  gateRomance: true,
  gateCRM: false,
  gatePersonals: false,
  
  // Encryption
  encryptionEnabled: false,
  encryptionKeyHash: null
};
```

### PIN Functions

```javascript
// Hash PIN with salt (never store plain)
async function hashPIN(pin, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate random salt
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Set new PIN
async function setPIN(pin) {
  if (pin.length < 4 || pin.length > 6) {
    toast('PIN must be 4-6 digits');
    return false;
  }
  
  const salt = generateSalt();
  const hash = await hashPIN(pin, salt);
  
  const security = getSecuritySettings();
  security.enabled = true;
  security.method = 'pin';
  security.pinHash = hash;
  security.pinSalt = salt;
  security.failedAttempts = 0;
  saveSecuritySettings(security);
  
  toast('✓ PIN set');
  return true;
}

// Verify PIN
async function verifyPIN(pin) {
  const security = getSecuritySettings();
  
  // Check lockout
  if (security.lockoutUntil && Date.now() < security.lockoutUntil) {
    const remaining = Math.ceil((security.lockoutUntil - Date.now()) / 60000);
    toast(`Locked out. Try again in ${remaining} min`);
    return false;
  }
  
  const hash = await hashPIN(pin, security.pinSalt);
  
  if (hash === security.pinHash) {
    security.failedAttempts = 0;
    security.lastActivity = Date.now();
    saveSecuritySettings(security);
    return true;
  } else {
    security.failedAttempts++;
    
    // Lockout after 5 failed attempts
    if (security.failedAttempts >= 5) {
      security.lockoutUntil = Date.now() + (15 * 60 * 1000); // 15 min
      toast('Too many attempts. Locked for 15 minutes.');
    } else {
      toast(`Incorrect PIN. ${5 - security.failedAttempts} attempts remaining.`);
    }
    
    saveSecuritySettings(security);
    return false;
  }
}

// Check if lock required
function shouldShowLock() {
  const security = getSecuritySettings();
  if (!security.enabled) return false;
  
  if (security.autoLockMinutes === 0) return false; // Never auto-lock
  
  const elapsed = Date.now() - security.lastActivity;
  const threshold = security.autoLockMinutes * 60 * 1000;
  
  return elapsed > threshold;
}

// Update activity timestamp
function updateActivity() {
  const security = getSecuritySettings();
  security.lastActivity = Date.now();
  saveSecuritySettings(security);
}
```

## 1.3 Biometric Authentication (WebAuthn)

### Check Device Capability

```javascript
async function canUseBiometrics() {
  if (!window.PublicKeyCredential) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (e) {
    return false;
  }
}
```

### Register Biometric

```javascript
async function registerBiometric() {
  if (!await canUseBiometrics()) {
    toast('Biometrics not available on this device');
    return false;
  }
  
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: 'Helix',
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode('helix-user'),
          name: 'helix-user',
          displayName: 'Helix User'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000
      }
    });
    
    // Store credential ID
    const security = getSecuritySettings();
    security.biometricCredentialId = arrayBufferToBase64(credential.rawId);
    security.method = security.method === 'pin' ? 'both' : 'biometric';
    saveSecuritySettings(security);
    
    toast('✓ Biometric registered');
    return true;
    
  } catch (e) {
    console.error('Biometric registration failed:', e);
    toast('Biometric setup failed');
    return false;
  }
}
```

### Authenticate with Biometric

```javascript
async function authenticateBiometric() {
  const security = getSecuritySettings();
  
  if (!security.biometricCredentialId) {
    return false;
  }
  
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
          type: 'public-key',
          id: base64ToArrayBuffer(security.biometricCredentialId)
        }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    
    if (assertion) {
      security.lastActivity = Date.now();
      security.failedAttempts = 0;
      saveSecuritySettings(security);
      return true;
    }
    
  } catch (e) {
    console.error('Biometric auth failed:', e);
    // Fall back to PIN
    return false;
  }
  
  return false;
}
```

### Helper Functions

```javascript
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

## 1.4 Lock Screen HTML

```html
<div class="lock-screen" id="lockScreen">
  <div class="lock-logo">
    <div class="lock-logo-text">HELIX</div>
    <div class="lock-logo-dots">
      <span class="lock-dot"></span>
      <span class="lock-dot"></span>
      <span class="lock-dot"></span>
    </div>
  </div>
  
  <div class="lock-prompt">Enter PIN to unlock</div>
  
  <div class="lock-pin-display">
    <span class="pin-dot" id="pinDot0"></span>
    <span class="pin-dot" id="pinDot1"></span>
    <span class="pin-dot" id="pinDot2"></span>
    <span class="pin-dot" id="pinDot3"></span>
  </div>
  
  <div class="lock-keypad">
    <button class="key-btn" onclick="enterPinDigit('1')">1</button>
    <button class="key-btn" onclick="enterPinDigit('2')">2</button>
    <button class="key-btn" onclick="enterPinDigit('3')">3</button>
    <button class="key-btn" onclick="enterPinDigit('4')">4</button>
    <button class="key-btn" onclick="enterPinDigit('5')">5</button>
    <button class="key-btn" onclick="enterPinDigit('6')">6</button>
    <button class="key-btn" onclick="enterPinDigit('7')">7</button>
    <button class="key-btn" onclick="enterPinDigit('8')">8</button>
    <button class="key-btn" onclick="enterPinDigit('9')">9</button>
    <button class="key-btn empty"></button>
    <button class="key-btn" onclick="enterPinDigit('0')">0</button>
    <button class="key-btn" onclick="deletePinDigit()">⌫</button>
  </div>
  
  <button class="biometric-btn" id="biometricBtn" onclick="tryBiometric()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>
    </svg>
    <span>Use Face ID / Touch ID</span>
  </button>
</div>
```

## 1.5 Lock Screen CSS

```css
.lock-screen {
  position: fixed;
  inset: 0;
  background: var(--black);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lock-screen.hidden {
  display: none;
}

.lock-logo {
  margin-bottom: 40px;
  text-align: center;
}

.lock-logo-text {
  font-family: Oswald;
  font-size: 36px;
  color: var(--amber);
  letter-spacing: 0.3em;
  text-shadow: 0 0 30px var(--amber-glow);
}

.lock-logo-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.lock-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 10px var(--amber-glow);
  animation: lock-pulse 2s infinite;
}

.lock-dot:nth-child(2) { animation-delay: 0.3s; }
.lock-dot:nth-child(3) { animation-delay: 0.6s; }

@keyframes lock-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.lock-prompt {
  font-size: 14px;
  color: var(--gray-light);
  margin-bottom: 24px;
}

.lock-pin-display {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.pin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--gray-mid);
  background: transparent;
  transition: all 0.15s;
}

.pin-dot.filled {
  background: var(--amber);
  border-color: var(--amber);
  box-shadow: 0 0 10px var(--amber-glow);
}

.pin-dot.error {
  border-color: var(--red);
  animation: shake 0.3s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.lock-keypad {
  display: grid;
  grid-template-columns: repeat(3, 70px);
  gap: 16px;
  margin-bottom: 32px;
}

.key-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 1px solid var(--gray-mid);
  background: var(--glass);
  color: var(--white);
  font-family: Oswald;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.15s;
}

.key-btn:active {
  background: var(--amber);
  border-color: var(--amber);
  color: var(--black);
  transform: scale(0.95);
}

.key-btn.empty {
  visibility: hidden;
}

.biometric-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: var(--glass);
  border: 1px solid var(--gray-mid);
  border-radius: 30px;
  color: var(--white);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.biometric-btn svg {
  width: 24px;
  height: 24px;
  stroke: var(--amber);
}

.biometric-btn:active {
  border-color: var(--amber);
  box-shadow: 0 0 20px var(--amber-glow);
}

.biometric-btn.hidden {
  display: none;
}
```

## 1.6 Lock Screen JS

```javascript
let enteredPIN = '';
const PIN_LENGTH = 4;

function showLockScreen() {
  document.getElementById('lockScreen').classList.remove('hidden');
  enteredPIN = '';
  updatePinDots();
  
  // Check if biometrics available
  canUseBiometrics().then(available => {
    document.getElementById('biometricBtn').classList.toggle('hidden', !available);
    
    // Auto-trigger biometric if available
    if (available) {
      setTimeout(() => tryBiometric(), 300);
    }
  });
}

function hideLockScreen() {
  document.getElementById('lockScreen').classList.add('hidden');
  enteredPIN = '';
}

function enterPinDigit(digit) {
  if (enteredPIN.length >= PIN_LENGTH) return;
  
  enteredPIN += digit;
  updatePinDots();
  haptic('light');
  
  if (enteredPIN.length === PIN_LENGTH) {
    verifyEnteredPIN();
  }
}

function deletePinDigit() {
  if (enteredPIN.length === 0) return;
  
  enteredPIN = enteredPIN.slice(0, -1);
  updatePinDots();
  haptic('light');
}

function updatePinDots() {
  for (let i = 0; i < PIN_LENGTH; i++) {
    const dot = document.getElementById('pinDot' + i);
    dot.classList.toggle('filled', i < enteredPIN.length);
    dot.classList.remove('error');
  }
}

async function verifyEnteredPIN() {
  const valid = await verifyPIN(enteredPIN);
  
  if (valid) {
    haptic('success');
    hideLockScreen();
  } else {
    haptic('error');
    // Show error state
    for (let i = 0; i < PIN_LENGTH; i++) {
      document.getElementById('pinDot' + i).classList.add('error');
    }
    // Clear after animation
    setTimeout(() => {
      enteredPIN = '';
      updatePinDots();
    }, 300);
  }
}

async function tryBiometric() {
  const success = await authenticateBiometric();
  if (success) {
    haptic('success');
    hideLockScreen();
  }
}

// Check lock on app load and visibility change
document.addEventListener('DOMContentLoaded', () => {
  if (shouldShowLock()) {
    showLockScreen();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && shouldShowLock()) {
    showLockScreen();
  }
});

// Update activity on interaction
document.addEventListener('touchstart', updateActivity, { passive: true });
document.addEventListener('click', updateActivity);
```

---

# SECTION 2: DATA PROTECTION (ENCRYPTION)

## 2.1 Encryption Overview

Sensitive data arrays are encrypted at rest:
- `S.invoices` — Financial data
- `S.prospects` — Business contacts
- `S.romances` — Personal relationships
- `S.contacts` — Personal contacts

## 2.2 Key Derivation

```javascript
// Derive encryption key from PIN
async function deriveKey(pin, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

## 2.3 Encrypt/Decrypt Functions

```javascript
// Encrypt data
async function encryptData(data, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  
  // Return IV + ciphertext as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return arrayBufferToBase64(combined.buffer);
}

// Decrypt data
async function decryptData(encryptedBase64, key) {
  const combined = base64ToArrayBuffer(encryptedBase64);
  const combinedArray = new Uint8Array(combined);
  
  const iv = combinedArray.slice(0, 12);
  const ciphertext = combinedArray.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}
```

## 2.4 Encrypted Storage Integration

```javascript
// Modified save() function
async function save() {
  const security = getSecuritySettings();
  
  if (security.encryptionEnabled && window._encryptionKey) {
    // Encrypt sensitive modules
    const toSave = { ...S };
    
    if (security.gateInvoices && S.invoices) {
      toSave.invoices_encrypted = await encryptData(S.invoices, window._encryptionKey);
      delete toSave.invoices;
    }
    
    if (security.gateRomance && S.romances) {
      toSave.romances_encrypted = await encryptData(S.romances, window._encryptionKey);
      delete toSave.romances;
    }
    
    if (security.gateCRM && S.prospects) {
      toSave.prospects_encrypted = await encryptData(S.prospects, window._encryptionKey);
      delete toSave.prospects;
    }
    
    localStorage.setItem('helix', JSON.stringify(toSave));
  } else {
    localStorage.setItem('helix', JSON.stringify(S));
  }
}

// Modified load() function
async function load() {
  const raw = localStorage.getItem('helix');
  if (!raw) return initDefaultState();
  
  const data = JSON.parse(raw);
  
  // Check for encrypted fields
  if (data.invoices_encrypted || data.romances_encrypted || data.prospects_encrypted) {
    // Need to decrypt after PIN entry
    window._pendingDecryption = data;
    return initDefaultState(); // Return empty until decrypted
  }
  
  S = data;
}

// Called after successful PIN verification
async function decryptPendingData(pin) {
  if (!window._pendingDecryption) return;
  
  const security = getSecuritySettings();
  const key = await deriveKey(pin, security.pinSalt);
  window._encryptionKey = key;
  
  const data = window._pendingDecryption;
  
  if (data.invoices_encrypted) {
    S.invoices = await decryptData(data.invoices_encrypted, key);
  }
  
  if (data.romances_encrypted) {
    S.romances = await decryptData(data.romances_encrypted, key);
  }
  
  if (data.prospects_encrypted) {
    S.prospects = await decryptData(data.prospects_encrypted, key);
  }
  
  // Copy non-encrypted fields
  Object.keys(data).forEach(k => {
    if (!k.endsWith('_encrypted') && !S[k]) {
      S[k] = data[k];
    }
  });
  
  window._pendingDecryption = null;
}
```

---

# SECTION 3: GEOLOCATION FEATURES

## 3.1 Permission Flow

```javascript
// Request location permission
async function requestLocationPermission() {
  if (!navigator.geolocation) {
    toast('Geolocation not supported');
    return false;
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Permission granted
        const settings = getLocationSettings();
        settings.enabled = true;
        saveLocationSettings(settings);
        resolve(true);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast('Location permission denied');
        }
        resolve(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
```

## 3.2 Get Current Location

```javascript
// Get current position
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        });
      },
      (error) => reject(error),
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 60000  // Cache for 1 min
      }
    );
  });
}

// Reverse geocode to address (using free Nominatim API)
async function getAddressFromCoords(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();
    
    if (data.address) {
      const { house_number, road, city, state, postcode } = data.address;
      return [house_number, road, city, state, postcode].filter(Boolean).join(', ');
    }
  } catch (e) {
    console.error('Geocoding failed:', e);
  }
  return null;
}
```

## 3.3 Auto-Tag on Create

```javascript
// Add location to new records
async function autoTagLocation(record) {
  const settings = getLocationSettings();
  if (!settings.enabled || !settings.autoTag) return record;
  
  try {
    const location = await getCurrentLocation();
    record.location = {
      lat: location.lat,
      lng: location.lng,
      timestamp: location.timestamp
    };
    
    // Optionally get address
    const address = await getAddressFromCoords(location.lat, location.lng);
    if (address) {
      record.location.address = address;
    }
  } catch (e) {
    console.log('Location unavailable:', e);
  }
  
  return record;
}
```

## 3.4 Distance Calculations

```javascript
// Haversine formula for distance between two points
function calculateDistance(lat1, lng1, lat2, lng2, unit = 'miles') {
  const R = unit === 'miles' ? 3959 : 6371; // Earth radius
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Format distance for display
function formatDistance(miles) {
  if (miles < 0.1) {
    return Math.round(miles * 5280) + ' ft';
  } else if (miles < 10) {
    return miles.toFixed(1) + ' mi';
  } else {
    return Math.round(miles) + ' mi';
  }
}
```

## 3.5 Nearby Filter

```javascript
// Filter records by distance
async function filterNearby(records, maxDistance = 10) {
  const settings = getLocationSettings();
  if (!settings.enabled) return records;
  
  try {
    const current = await getCurrentLocation();
    
    return records
      .filter(r => r.location && r.location.lat && r.location.lng)
      .map(r => ({
        ...r,
        distance: calculateDistance(
          current.lat, current.lng,
          r.location.lat, r.location.lng,
          settings.unit
        )
      }))
      .filter(r => r.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
      
  } catch (e) {
    return records;
  }
}
```

## 3.6 Check-In for Jobs

```javascript
// Geo-stamped check-in
async function checkInJob(jobId) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!job) return;
  
  try {
    const location = await getCurrentLocation();
    
    job.checkIns = job.checkIns || [];
    job.checkIns.push({
      type: 'in',
      timestamp: Date.now(),
      location: { lat: location.lat, lng: location.lng }
    });
    
    job.status = 'active';
    save();
    renderJobs();
    toast('✓ Checked in');
    
  } catch (e) {
    toast('Location unavailable');
  }
}

// Geo-stamped check-out
async function checkOutJob(jobId) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!job) return;
  
  try {
    const location = await getCurrentLocation();
    
    job.checkIns = job.checkIns || [];
    job.checkIns.push({
      type: 'out',
      timestamp: Date.now(),
      location: { lat: location.lat, lng: location.lng }
    });
    
    save();
    renderJobs();
    toast('✓ Checked out');
    
  } catch (e) {
    toast('Location unavailable');
  }
}
```

## 3.7 Location Settings Model

```javascript
const locationSettings = {
  enabled: false,
  autoTag: true,          // Auto-tag new records
  showNearby: true,       // Show nearby filters
  unit: 'miles',          // 'miles' | 'km'
  defaultRadius: 10,      // Default nearby radius
  checkInReminder: true   // Remind to check in on Jobs
};
```

---

# SECTION 4: SETTINGS PANEL UI

## 4.1 Security Settings

```html
<div class="settings-section">
  <div class="settings-section-title">SECURITY</div>
  
  <div class="settings-row">
    <div class="settings-label">App Lock</div>
    <select id="settingsLockMethod" onchange="updateLockMethod(this.value)">
      <option value="off">Off</option>
      <option value="pin">PIN</option>
      <option value="biometric">Biometric</option>
      <option value="both">Both</option>
    </select>
  </div>
  
  <div class="settings-row">
    <div class="settings-label">Auto-Lock</div>
    <select id="settingsAutoLock" onchange="updateAutoLock(this.value)">
      <option value="1">1 minute</option>
      <option value="5">5 minutes</option>
      <option value="15">15 minutes</option>
      <option value="0">Never</option>
    </select>
  </div>
  
  <div class="settings-subsection">Protected Modules</div>
  
  <div class="settings-row">
    <span>Gate Invoices</span>
    <div class="helix-toggle" onclick="toggleGate('invoices')"></div>
  </div>
  
  <div class="settings-row">
    <span>Gate Romance</span>
    <div class="helix-toggle" onclick="toggleGate('romance')"></div>
  </div>
  
  <div class="settings-row">
    <span>Encrypt Data</span>
    <div class="helix-toggle" onclick="toggleEncryption()"></div>
  </div>
</div>
```

## 4.2 Location Settings

```html
<div class="settings-section">
  <div class="settings-section-title">LOCATION</div>
  
  <div class="settings-row">
    <span>Enable Location</span>
    <div class="helix-toggle" onclick="toggleLocation()"></div>
  </div>
  
  <div class="settings-row">
    <span>Auto-Tag Records</span>
    <div class="helix-toggle" onclick="toggleAutoTag()"></div>
  </div>
  
  <div class="settings-row">
    <span>Show Nearby Filters</span>
    <div class="helix-toggle" onclick="toggleNearby()"></div>
  </div>
  
  <div class="settings-row">
    <div class="settings-label">Distance Unit</div>
    <select onchange="updateDistanceUnit(this.value)">
      <option value="miles">Miles</option>
      <option value="km">Kilometers</option>
    </select>
  </div>
</div>
```

---

# SECTION 5: BROWSER SUPPORT

| Feature | Chrome 90+ | Safari 14+ | Firefox 90+ |
|---------|------------|------------|-------------|
| WebAuthn | ✅ | ✅ | ✅ |
| Face ID (iOS) | — | ✅ | — |
| Touch ID | ✅ | ✅ | ✅ |
| Geolocation | ✅ | ✅ | ✅ |
| Web Crypto | ✅ | ✅ | ✅ |
| AES-GCM | ✅ | ✅ | ✅ |

---

# SECTION 6: BUILD ORDER

```
PHASE 1: PIN Lock (2-3 hrs)
├── Lock screen HTML/CSS
├── PIN entry UI
├── hashPIN / verifyPIN
├── Auto-lock timer
└── Settings toggles

PHASE 2: Biometrics (2 hrs)
├── Capability detection
├── WebAuthn registration
├── WebAuthn auth
└── Fallback to PIN

PHASE 3: Encryption (2-3 hrs)
├── Key derivation
├── encrypt/decrypt functions
├── Modified save/load
└── Module gating

PHASE 4: Geolocation (2-3 hrs)
├── Permission flow
├── Auto-tag on create
├── Nearby filters
├── Check-in for Jobs
└── Settings panel

TOTAL: ~10-12 hours
```

---

# SECTION 7: SECURITY NOTES

- **NEVER** store plain PIN — use SHA-256 hash with random salt
- AES-256-GCM for encryption (authenticated)
- PBKDF2 key derivation (100,000 iterations)
- Lockout after 5 failed PIN attempts
- Biometric data never leaves device
- Location data stays in localStorage only

---

*HELIX SECURITY & LOCATION SUITE*
*Document Version: 1.0*
*Created: March 12, 2026*
*For: Claude Code Implementation*

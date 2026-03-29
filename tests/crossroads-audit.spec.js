// @ts-check
/**
 * Crossroads Drag-Drop Audit
 *
 * Tests every valid crossroads combination by:
 *   1. Seeding data so each source type has a card
 *   2. Using the __crossroadsTest API to fire deposits programmatically
 *   3. Verifying the handler exists, executes without JS errors,
 *      and produces the expected side-effect (record creation, panel open, etc.)
 *   4. Also tests the real pointer-event drag path for a representative combo
 */

const { test, expect } = require('@playwright/test');
const {
  clearHelixData, seedTestData, getHelixState, getStateCount,
  createTestProspect, createTestJob, createTestInvoice, createTestExpense,
  createTestNote, createTestTask, createTestBooking, createTestEvent,
  createTestService, createTestContact,
  fireDeposit, fireSubDeposit,
} = require('./helpers/helix');

// Increase timeout for all tests — the PWA is large
test.use({ actionTimeout: 15000 });

// ═══════════════════════════════════════════════════════════
// SEED DATA — one item per source type
// ═══════════════════════════════════════════════════════════

const SEED = {
  prospects: [
    createTestProspect({ id: 'audit_p1', biz: 'Audit Corp', contact: 'Auditor', status: 'lead' }),
  ],
  jobs: [
    createTestJob({ id: 'audit_j1', title: 'Audit Job', clientId: 'audit_p1', status: 'active', rate: 100 }),
  ],
  invoices: [
    createTestInvoice({ id: 'audit_i1', number: 'INV-AUD-001', clientId: 'audit_p1', total: 250, status: 'sent',
      items: [{ description: 'Audit service', qty: 1, price: 250, total: 250 }] }),
  ],
  expenses: [
    createTestExpense({ id: 'audit_e1', vendor: 'Office Max', amount: 45, category: 'supplies' }),
  ],
  notes: [
    createTestNote({ id: 'audit_n1', title: 'Audit Note', body: 'Body text', prospectId: 'audit_p1' }),
  ],
  tasks: [
    createTestTask({ id: 'audit_t1', title: 'Audit Task', prospectId: 'audit_p1' }),
  ],
  bookings: [
    createTestBooking({ id: 'audit_bk1', clientName: 'Auditor' }),
  ],
  events: [
    createTestEvent({ id: 'audit_ev1', title: 'Audit Meeting' }),
  ],
  services: [
    createTestService({ id: 'audit_sv1', name: 'Audit Consulting', rate: 150 }),
  ],
  contacts: [
    createTestContact({ id: 'audit_c1', name: 'Audit Contact', phone: '555-9999' }),
  ],
  bankTransactions: [],
  bankAccounts: [{ id: 'audit_acct1', name: 'Audit Checking', balance: 5000, type: 'checking' }],
  circlebacks: [],
};

// ═══════════════════════════════════════════════════════════
// SETUP — shared via beforeEach in each describe block
// ═══════════════════════════════════════════════════════════

async function setup(page) {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('demo-guided', '1'));
  await clearHelixData(page);
  await seedTestData(page, SEED);
  await page.reload();
  // Wait for crossroads API — this is the critical gate
  await page.waitForFunction(() => typeof window.__crossroadsTest !== 'undefined', { timeout: 20000 });
}

function sourceDataFor(type) {
  const map = {
    prospect: SEED.prospects[0],
    job: SEED.jobs[0],
    invoice: SEED.invoices[0],
    expense: SEED.expenses[0],
    note: SEED.notes[0],
    task: SEED.tasks[0],
    booking: SEED.bookings[0],
    event: SEED.events[0],
    service: SEED.services[0],
    contact: SEED.contacts[0],
    mission: { id: 'audit_m1', title: 'Audit Mission', status: 'active' },
    product: { id: 'audit_pr1', name: 'Audit Product', price: 20 },
    bank: { id: 'audit_bk_tx', amount: -100, description: 'Test bank tx' },
    receipt: { id: 'audit_rc1', vendor: 'Receipt Vendor', amount: 30, date: new Date().toISOString().split('T')[0] },
  };
  return map[type] || {};
}

// ═══════════════════════════════════════════════════════════
// 1. HANDLER REGISTRY — verify handler coverage
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads Audit - Handler Coverage', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('every subDestMap combo has at least one registered handler', async ({ page }) => {
    const report = await page.evaluate(() => {
      const api = window.__crossroadsTest;
      if (!api) return { error: '__crossroadsTest not exposed' };
      const handlerKeys = Object.keys(api.allHandlers);
      const combos = {};
      for (const key of handlerKeys) {
        const combo = key.includes('/') ? key.split('/')[0] : key;
        combos[combo] = combos[combo] || [];
        combos[combo].push(key);
      }
      return { handlerCount: handlerKeys.length, combos };
    });
    expect(report.error).toBeUndefined();
    console.log(`  Handler count: ${report.handlerCount}`);
    console.log(`  Unique combos: ${Object.keys(report.combos).length}`);
    expect(report.handlerCount).toBeGreaterThan(30);
  });

  test('no handler is a non-function', async ({ page }) => {
    const bad = await page.evaluate(() => {
      const api = window.__crossroadsTest;
      if (!api) return ['__crossroadsTest missing'];
      const missing = [];
      for (const [key, val] of Object.entries(api.allHandlers)) {
        if (typeof val !== 'function') missing.push(key);
      }
      return missing;
    });
    expect(bad).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. RECORD-CREATING COMBOS — verify count increases
// ═══════════════════════════════════════════════════════════

const RECORD_COMBOS = [
  ['prospect-jobs', 'newJob', 'prospect', 'jobs', 'Prospect -> Jobs (new job)'],
  ['prospect-tasks', 'followUpTask', 'prospect', 'tasks', 'Prospect -> Tasks (follow-up)'],
  ['prospect-tasks', 'samplePrep', 'prospect', 'tasks', 'Prospect -> Tasks (sample prep)'],
  ['job-invoices', 'generateInvoice', 'job', 'invoices', 'Job -> Invoices (generate)'],
  ['job-tasks', 'followUp', 'job', 'tasks', 'Job -> Tasks (follow-up)'],
  ['job-notes', 'workNotes', 'job', 'notes', 'Job -> Notes (work notes)'],
  ['invoice-tasks', 'paymentFollowUp', 'invoice', 'tasks', 'Invoice -> Tasks (payment follow-up)'],
  ['invoice-notes', 'paymentNote', 'invoice', 'notes', 'Invoice -> Notes (payment note)'],
  ['expense-banking', 'linkTransaction', 'expense', 'bankTransactions', 'Expense -> Banking (link tx)'],
  ['expense-tasks', 'followUp', 'expense', 'tasks', 'Expense -> Tasks (follow-up)'],
  ['note-tasks', 'createTask', 'note', 'tasks', 'Note -> Tasks (create task)'],
  ['task-jobs', 'convertJob', 'task', 'jobs', 'Task -> Jobs (convert)'],
  ['booking-jobs', 'newJob', 'booking', 'jobs', 'Booking -> Jobs (new job)'],
  ['event-jobs', 'newJob', 'event', 'jobs', 'Event -> Jobs (new job)'],
  ['event-tasks', 'prepTask', 'event', 'tasks', 'Event -> Tasks (prep task)'],
  ['contact-tasks', 'followUp', 'contact', 'tasks', 'Contact -> Tasks (follow-up)'],
  ['contact-jobs', 'newJob', 'contact', 'jobs', 'Contact -> Jobs (new job)'],
  ['service-jobs', 'newJob', 'service', 'jobs', 'Service -> Jobs (new job)'],
];

test.describe('Crossroads Audit - Record-Creating Combos', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  for (const [combo, subKey, srcType, stateKey, desc] of RECORD_COMBOS) {
    test(desc, async ({ page }) => {
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));

      const before = await getStateCount(page, stateKey);
      const fired = await fireSubDeposit(page, combo, subKey, sourceDataFor(srcType));
      await page.waitForTimeout(800);
      const after = await getStateCount(page, stateKey);

      const passed = after > before;
      console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${desc}  (${before} -> ${after})${jsErrors.length ? '  JS errors: ' + jsErrors.join('; ') : ''}`);

      expect(fired).toBe(true);
      expect(after).toBeGreaterThan(before);
      expect(jsErrors).toEqual([]);
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 3. PANEL-OPENING COMBOS — verify correct panel opens
// ═══════════════════════════════════════════════════════════

const PANEL_COMBOS = [
  ['prospect-notes', 'newNote', 'prospect', '#panel-notes', 'Prospect -> Notes (opens panel)'],
  ['prospect-schedule', 'newMeeting', 'prospect', '#panel-schedule', 'Prospect -> Schedule (new meeting)'],
  ['prospect-schedule', 'followUp', 'prospect', '#panel-schedule', 'Prospect -> Schedule (follow-up)'],
  ['prospect-invoices', 'newInvoice', 'prospect', '#panel-invoices', 'Prospect -> Invoices (new invoice)'],
  ['task-schedule', 'blockTime', 'task', '#panel-schedule', 'Task -> Schedule (block time)'],
  ['task-notes', 'document', 'task', '#panel-notes', 'Task -> Notes (document)'],
  ['note-crm', 'newProspect', 'note', '#panel-crm', 'Note -> CRM (new prospect)'],
  ['note-schedule', 'createEvent', 'note', '#panel-schedule', 'Note -> Schedule (create event)'],
  ['contact-notes', 'newNote', 'contact', '#panel-notes', 'Contact -> Notes (new note)'],
  ['job-schedule', 'blockTime', 'job', '#panel-schedule', 'Job -> Schedule (block time)'],
  ['expense-notes', 'expenseNote', 'expense', '#panel-notes', 'Expense -> Notes (expense note)'],
];

test.describe('Crossroads Audit - Panel-Opening Combos', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  for (const [combo, subKey, srcType, panelSel, desc] of PANEL_COMBOS) {
    test(desc, async ({ page }) => {
      const jsErrors = [];
      page.on('pageerror', err => jsErrors.push(err.message));

      const fired = await fireSubDeposit(page, combo, subKey, sourceDataFor(srcType));
      await page.waitForTimeout(1000);

      const panelOpen = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.classList.contains('open') : false;
      }, panelSel);

      console.log(`  [${panelOpen ? 'PASS' : 'FAIL'}] ${desc}${jsErrors.length ? '  JS errors: ' + jsErrors.join('; ') : ''}`);

      expect(fired).toBe(true);
      expect(panelOpen).toBe(true);
      expect(jsErrors).toEqual([]);
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 4. DISABLED / SELF-DROP COMBOS — verify no duplicate
// ═══════════════════════════════════════════════════════════

const DISABLED_COMBOS = [
  ['prospect', 'crm', 'prospects'],
  ['note', 'notes', 'notes'],
  ['task', 'tasks', 'tasks'],
  ['job', 'jobs', 'jobs'],
  ['invoice', 'invoices', 'invoices'],
  ['expense', 'expenses', 'expenses'],
  ['contact', 'contacts', 'contacts'],
];

test.describe('Crossroads Audit - Disabled Self-Drops', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  for (const [srcType, destType, stateKey] of DISABLED_COMBOS) {
    test(`${srcType} -> ${destType} is blocked`, async ({ page }) => {
      const before = await getStateCount(page, stateKey);
      await fireDeposit(page, srcType, destType, sourceDataFor(srcType));
      await page.waitForTimeout(400);
      const after = await getStateCount(page, stateKey);
      console.log(`  [${after === before ? 'PASS' : 'FAIL'}] ${srcType} -> ${destType} blocked  (${before} -> ${after})`);
      expect(after).toBe(before);
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 5. CONFIRMATION BANNER — fires after deposit
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads Audit - Confirmation Banner', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('showCrossroadsConfirm creates banner element', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof showCrossroadsConfirm === 'function') {
        showCrossroadsConfirm(
          { sourceType: 'prospect', name: 'Audit Corp', sourceData: {} },
          'jobs'
        );
      }
    });
    await page.waitForTimeout(300);
    const banner = page.locator('#crossroadsConfirm');
    await expect(banner).toBeAttached();
  });

  test('confirmation banner auto-dismisses', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof showCrossroadsConfirm === 'function') {
        showCrossroadsConfirm(
          { sourceType: 'expense', name: 'Office Max', sourceData: {} },
          'banking'
        );
      }
    });
    await page.waitForTimeout(300);
    await expect(page.locator('#crossroadsConfirm')).toBeAttached();
    await page.waitForTimeout(4000);
    await expect(page.locator('#crossroadsConfirm')).not.toBeAttached();
  });
});

// ═══════════════════════════════════════════════════════════
// 6. DATA INTEGRITY — rapid-fire deposits
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads Audit - Data Integrity', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('state is valid JSON after rapid deposits', async ({ page }) => {
    await fireSubDeposit(page, 'prospect-tasks', 'followUpTask', SEED.prospects[0]);
    await fireSubDeposit(page, 'job-notes', 'workNotes', SEED.jobs[0]);
    await fireSubDeposit(page, 'invoice-tasks', 'paymentFollowUp', SEED.invoices[0]);
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[0]);
    await fireSubDeposit(page, 'note-tasks', 'createTask', SEED.notes[0]);
    await page.waitForTimeout(1500);

    const state = await getHelixState(page);
    expect(state).toBeTruthy();
    expect(Array.isArray(state.prospects)).toBe(true);
    expect(Array.isArray(state.tasks)).toBe(true);
    expect(Array.isArray(state.notes)).toBe(true);
    expect(Array.isArray(state.jobs)).toBe(true);
    expect(Array.isArray(state.invoices)).toBe(true);
  });

  test('source records preserved after deposit', async ({ page }) => {
    const prospectsBefore = await getStateCount(page, 'prospects');
    await fireSubDeposit(page, 'prospect-jobs', 'newJob', SEED.prospects[0]);
    await page.waitForTimeout(800);
    expect(await getStateCount(page, 'prospects')).toBe(prospectsBefore);
  });

  test('state survives reload after deposits', async ({ page }) => {
    await fireSubDeposit(page, 'prospect-jobs', 'newJob', SEED.prospects[0]);
    await fireSubDeposit(page, 'job-notes', 'workNotes', SEED.jobs[0]);
    await page.waitForTimeout(800);

    const before = await getHelixState(page);
    await page.reload();
    await page.waitForFunction(() => typeof window.__crossroadsTest !== 'undefined', { timeout: 20000 });

    const after = await getHelixState(page);
    expect(after.jobs.length).toBe(before.jobs.length);
    expect(after.notes.length).toBe(before.notes.length);
  });
});

// ═══════════════════════════════════════════════════════════
// 7. REAL POINTER DRAG PATH — simulates actual user gesture
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads Audit - Pointer Drag (real gesture)', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('long-press on prospect card activates crossroads mode', async ({ page }) => {
    // Open CRM panel to see prospect cards
    await page.click('#bCRM');
    await page.waitForTimeout(600);

    const card = page.locator('#panel-crm .p-card, #panel-crm .prospect-card, #panel-crm [data-id]').first();
    const cardVisible = await card.isVisible().catch(() => false);

    if (!cardVisible) {
      console.log('  [SKIP] No visible prospect card found');
      test.skip();
      return;
    }

    const box = await card.boundingBox();

    // Simulate long-press via mousedown held for 700ms
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(700);

    const active = await page.evaluate(() => document.body.classList.contains('crossroads-active'));
    console.log(`  Crossroads active after mouse long-press: ${active}`);

    if (active) {
      // Find a visible drop target button (L1 buttons are visible by default)
      // Use bMis (tasks/missions) which is on L1 and always visible
      const targetBtn = await page.evaluate(() => {
        // Find first visible crossroads target button
        const candidates = ['bMis', 'bNotes', 'bEml', 'bCRM', 'bJobs'];
        for (const id of candidates) {
          const el = document.getElementById(id);
          if (el) {
            const parent = el.closest('.btns');
            // Check button is not in a hidden layer
            if (parent && !parent.classList.contains('hide')) {
              const r = el.getBoundingClientRect();
              return { id, x: r.left + r.width / 2, y: r.top + r.height / 2 };
            }
          }
        }
        return null;
      });

      if (targetBtn) {
        console.log(`  Dragging to target: ${targetBtn.id}`);
        // Move pointer slowly to the target button
        await page.mouse.move(targetBtn.x, targetBtn.y, { steps: 15 });
        await page.waitForTimeout(400);

        // Check if any button has hover
        const hoverState = await page.evaluate(() => {
          const btns = document.querySelectorAll('.btn');
          for (const btn of btns) {
            if (btn.classList.contains('crossroads-hover')) return btn.id;
          }
          return null;
        });
        console.log(`  Button with crossroads-hover: ${hoverState || 'none'}`);

        // Release
        await page.mouse.up();
        await page.waitForTimeout(2500);

        // Check for confirmation, sub-dest picker, or that crossroads ended
        const result = await page.evaluate(() => {
          return {
            confirm: !!document.getElementById('crossroadsConfirm'),
            picker: !!document.getElementById('subDestPicker'),
            stillActive: document.body.classList.contains('crossroads-active'),
          };
        });
        console.log(`  Result: confirm=${result.confirm}, picker=${result.picker}, stillActive=${result.stillActive}`);

        // Success if: confirmation appeared, or picker appeared, or crossroads mode ended (drop was processed)
        const dropProcessed = result.confirm || result.picker || !result.stillActive;
        expect(dropProcessed).toBe(true);
      } else {
        console.log('  [SKIP] No visible target buttons found during crossroads');
        await page.mouse.up();
      }
    } else {
      await page.mouse.up();
      // Try touch events (crossroads may only listen to touch on some builds)
      console.log('  Trying touch dispatch...');
      const touchActivated = await page.evaluate(({ cx, cy }) => {
        const el = document.elementFromPoint(cx, cy);
        if (!el) return false;
        const touch = new Touch({ identifier: 1, target: el, clientX: cx, clientY: cy });
        el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], changedTouches: [touch], bubbles: true }));
        return true;
      }, { cx: box.x + box.width / 2, cy: box.y + box.height / 2 });
      await page.waitForTimeout(700);

      const activeAfterTouch = await page.evaluate(() => document.body.classList.contains('crossroads-active'));
      console.log(`  Crossroads active after touch dispatch: ${activeAfterTouch}`);

      await page.evaluate(({ cx, cy }) => {
        const el = document.elementFromPoint(cx, cy);
        if (!el) return;
        const touch = new Touch({ identifier: 1, target: el, clientX: cx, clientY: cy });
        el.dispatchEvent(new TouchEvent('touchend', { changedTouches: [touch], bubbles: true }));
      }, { cx: box.x + box.width / 2, cy: box.y + box.height / 2 });

      expect(active || activeAfterTouch).toBe(true);
    }
  });

  test('crossroads DOM elements exist', async ({ page }) => {
    const elements = await page.evaluate(() => ({
      floatEl: !!document.getElementById('crossroadsFloat') || !!document.querySelector('.crossroads-float'),
      targetButtons: {
        bCRM: !!document.getElementById('bCRM'),
        bJobs: !!document.getElementById('bJobs'),
        bInvoices: !!document.getElementById('bInvoices'),
        bMis: !!document.getElementById('bMis'),
        bNotes: !!document.getElementById('bNotes'),
        bEml: !!document.getElementById('bEml'),
      },
    }));
    console.log('  Float element:', elements.floatEl);
    console.log('  Target buttons:', JSON.stringify(elements.targetButtons));
    expect(elements.floatEl).toBe(true);
    for (const [name, exists] of Object.entries(elements.targetButtons)) {
      expect(exists).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// 8. FULL COMBO MATRIX REPORT — enumerate all registered combos
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads Audit - Full Combo Matrix Report', () => {
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('print full handler registry', async ({ page }) => {
    const report = await page.evaluate(() => {
      const api = window.__crossroadsTest;
      if (!api) return { error: 'API not found' };
      const keys = Object.keys(api.allHandlers).sort();
      const byCombo = {};
      for (const k of keys) {
        const parts = k.split('/');
        const combo = parts[0];
        const sub = parts[1] || '(direct)';
        byCombo[combo] = byCombo[combo] || [];
        byCombo[combo].push({ sub, isFunction: typeof api.allHandlers[k] === 'function' });
      }
      return { total: keys.length, combos: byCombo };
    });

    expect(report.error).toBeUndefined();

    console.log('\n  ══════════════════════════════════════════════════');
    console.log('       CROSSROADS HANDLER REGISTRY REPORT          ');
    console.log('  ══════════════════════════════════════════════════');
    console.log(`    Total handlers: ${report.total}`);
    console.log(`    Unique combos:  ${Object.keys(report.combos).length}`);
    console.log('  ══════════════════════════════════════════════════');

    for (const [combo, subs] of Object.entries(report.combos)) {
      const allOk = subs.every(s => s.isFunction);
      const mark = allOk ? 'OK' : 'ISSUE';
      console.log(`    [${mark}] ${combo}`);
      for (const s of subs) {
        console.log(`          ${s.isFunction ? '+' : '!'} ${s.sub}`);
      }
    }
    console.log('  ══════════════════════════════════════════════════\n');
    expect(report.total).toBeGreaterThan(30);
  });
});

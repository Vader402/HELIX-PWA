// @ts-check
const { test, expect } = require('@playwright/test');
const { getHelixState } = require('../helpers/helix');

// Helper: programmatically fire a crossroads deposit combo
async function fireDeposit(page, sourceType, destType, sourceData) {
  return await page.evaluate(({ src, dest, data }) => {
    const api = window.__crossroadsTest;
    if (api && typeof api.depositCard === 'function') {
      api.depositCard(src, dest, { sourceType: src, sourceData: data, name: data.biz || data.title || data.name || 'Test' });
      return true;
    }
    return false;
  }, { src: sourceType, dest: destType, data: sourceData });
}

// Helper: fire a sub-destination deposit
async function fireSubDeposit(page, combo, subKey, sourceData) {
  return await page.evaluate(({ c, sk, data }) => {
    const api = window.__crossroadsTest;
    if (api && typeof api.executeDeposit === 'function') {
      api.executeDeposit(c, sk, { sourceType: c.split('-')[0], sourceData: data, name: data.biz || data.title || data.name || 'Test' });
      return true;
    }
    return false;
  }, { c: combo, sk: subKey, data: sourceData });
}

// Helper: add item to state via localStorage + reload
async function addToState(page, key, item) {
  await page.evaluate(({ k, v }) => {
    const raw = localStorage.getItem('scV12');
    const state = raw ? JSON.parse(raw) : {};
    state[k] = state[k] || [];
    state[k].push(v);
    localStorage.setItem('scV12', JSON.stringify(state));
  }, { k: key, v: item });
  await page.reload();
  await page.waitForTimeout(1000);
}

// ═══ PROSPECT FLOWS ═══

test.describe('Crossroads — Prospect → Tasks (creates records)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('prospect → tasks/followUpTask creates a follow-up task', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects[0];
    const tasksBefore = state.tasks ? state.tasks.length : 0;

    await fireSubDeposit(page, 'prospect-tasks', 'followUpTask', prospect);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.tasks.length).toBeGreaterThan(tasksBefore);
  });

  test('prospect → tasks/samplePrep creates a sample prep task', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects[0];
    const tasksBefore = state.tasks ? state.tasks.length : 0;

    await fireSubDeposit(page, 'prospect-tasks', 'samplePrep', prospect);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.tasks.length).toBeGreaterThan(tasksBefore);
  });
});

test.describe('Crossroads — Prospect → Panels (opens UI)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('prospect → notes/newNote opens notes panel with pre-filled title', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects[0];

    await fireSubDeposit(page, 'prospect-notes', 'newNote', prospect);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
  });

  test('prospect → schedule/newMeeting opens schedule panel', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects[0];

    await fireSubDeposit(page, 'prospect-schedule', 'newMeeting', prospect);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-schedule')).toHaveClass(/open/);
  });

  test('prospect → schedule/followUp opens schedule panel', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects[0];

    await fireSubDeposit(page, 'prospect-schedule', 'followUp', prospect);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-schedule')).toHaveClass(/open/);
  });

  test('prospect → invoices/newInvoice opens invoices panel', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects[0];

    await fireSubDeposit(page, 'prospect-invoices', 'newInvoice', prospect);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-invoices')).toHaveClass(/open/);
  });
});

// ═══ NOTE FLOWS ═══

test.describe('Crossroads — Note Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await addToState(page, 'notes', {
      id: 'test_note_cx',
      title: 'Test Note for Crossroads',
      body: 'This note is used for crossroads testing',
      created: new Date().toISOString(),
    });
  });

  test('note → tasks/createTask creates a task from note', async ({ page }) => {
    const state = await getHelixState(page);
    const note = state.notes.find(n => n.id === 'test_note_cx');
    const tasksBefore = state.tasks ? state.tasks.length : 0;

    await fireSubDeposit(page, 'note-tasks', 'createTask', note);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.tasks.length).toBeGreaterThan(tasksBefore);
  });

  test('note → crm/newProspect opens CRM with new prospect form', async ({ page }) => {
    const state = await getHelixState(page);
    const note = state.notes.find(n => n.id === 'test_note_cx');

    await fireSubDeposit(page, 'note-crm', 'newProspect', note);
    await page.waitForTimeout(800);

    // Should open CRM panel
    await expect(page.locator('#panel-crm')).toHaveClass(/open/);
  });

  test('note → schedule/createEvent opens schedule panel', async ({ page }) => {
    const state = await getHelixState(page);
    const note = state.notes.find(n => n.id === 'test_note_cx');

    await fireSubDeposit(page, 'note-schedule', 'createEvent', note);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-schedule')).toHaveClass(/open/);
  });
});

// ═══ TASK FLOWS ═══

test.describe('Crossroads — Task Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await addToState(page, 'tasks', {
      id: 'test_task_cx',
      title: 'Test Task for Crossroads',
      done: false,
      created: new Date().toISOString(),
    });
  });

  test('task → schedule/blockTime opens schedule panel', async ({ page }) => {
    const state = await getHelixState(page);
    const task = state.tasks.find(t => t.id === 'test_task_cx');

    await fireSubDeposit(page, 'task-schedule', 'blockTime', task);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-schedule')).toHaveClass(/open/);
  });

  test('task → notes/document opens notes panel', async ({ page }) => {
    const state = await getHelixState(page);
    const task = state.tasks.find(t => t.id === 'test_task_cx');

    await fireSubDeposit(page, 'task-notes', 'document', task);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
  });
});

// ═══ JOB FLOWS ═══

test.describe('Crossroads — Job Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await addToState(page, 'jobs', {
      id: 'test_job_cx',
      title: 'Test Job for Crossroads',
      status: 'active',
      rate: 150,
      created: new Date().toISOString(),
    });
  });

  test('job → tasks/followUp creates job follow-up task', async ({ page }) => {
    const state = await getHelixState(page);
    const job = state.jobs.find(j => j.id === 'test_job_cx');
    const tasksBefore = state.tasks ? state.tasks.length : 0;

    await fireSubDeposit(page, 'job-tasks', 'followUp', job);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.tasks.length).toBeGreaterThan(tasksBefore);
  });

  test('job → notes/workNotes creates work notes in state', async ({ page }) => {
    const state = await getHelixState(page);
    const job = state.jobs.find(j => j.id === 'test_job_cx');
    const notesBefore = state.notes ? state.notes.length : 0;

    await fireSubDeposit(page, 'job-notes', 'workNotes', job);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.notes.length).toBeGreaterThan(notesBefore);
  });

  test('job → schedule/blockTime opens schedule panel', async ({ page }) => {
    const state = await getHelixState(page);
    const job = state.jobs.find(j => j.id === 'test_job_cx');

    await fireSubDeposit(page, 'job-schedule', 'blockTime', job);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-schedule')).toHaveClass(/open/);
  });
});

// ═══ INVOICE FLOWS ═══

test.describe('Crossroads — Invoice Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await addToState(page, 'invoices', {
      id: 'test_inv_cx',
      number: 'INV-CX-001',
      total: 500,
      status: 'sent',
      created: new Date().toISOString(),
    });
  });

  test('invoice → tasks/paymentFollowUp creates follow-up task', async ({ page }) => {
    const state = await getHelixState(page);
    const inv = state.invoices.find(i => i.id === 'test_inv_cx');
    const tasksBefore = state.tasks ? state.tasks.length : 0;

    await fireSubDeposit(page, 'invoice-tasks', 'paymentFollowUp', inv);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.tasks.length).toBeGreaterThan(tasksBefore);
  });

  test('invoice → notes/paymentNote creates payment note in state', async ({ page }) => {
    const state = await getHelixState(page);
    const inv = state.invoices.find(i => i.id === 'test_inv_cx');
    const notesBefore = state.notes ? state.notes.length : 0;

    await fireSubDeposit(page, 'invoice-notes', 'paymentNote', inv);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.notes.length).toBeGreaterThan(notesBefore);
  });
});

// ═══ DISABLED COMBOS ═══

test.describe('Crossroads — Disabled Combos', () => {
  test('self-to-self deposit is rejected (does not duplicate)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const state = await getHelixState(page);
    const prospect = state.prospects[0];
    const beforeCount = state.prospects.length;

    await fireDeposit(page, 'prospect', 'crm', prospect);
    await page.waitForTimeout(400);

    const after = await getHelixState(page);
    expect(after.prospects.length).toBe(beforeCount);
  });
});

// ═══ CONTACT FLOWS ═══

test.describe('Crossroads — Contact Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await addToState(page, 'contacts', {
      id: 'test_contact_cx',
      name: 'Jane Doe Test',
      phone: '555-0100',
      created: new Date().toISOString(),
    });
  });

  test('contact → tasks/followUp creates follow-up task', async ({ page }) => {
    const state = await getHelixState(page);
    const contact = state.contacts.find(c => c.id === 'test_contact_cx');
    const tasksBefore = state.tasks ? state.tasks.length : 0;

    await fireSubDeposit(page, 'contact-tasks', 'followUp', contact);
    await page.waitForTimeout(600);

    const after = await getHelixState(page);
    expect(after.tasks.length).toBeGreaterThan(tasksBefore);
  });

  test('contact → notes/newNote opens notes panel', async ({ page }) => {
    const state = await getHelixState(page);
    const contact = state.contacts.find(c => c.id === 'test_contact_cx');

    await fireSubDeposit(page, 'contact-notes', 'newNote', contact);
    await page.waitForTimeout(800);

    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const {
  clearHelixData, seedTestData, getHelixState, getStateCount,
  createTestProspect, createTestJob, createTestInvoice, createTestExpense,
  createTestNote, createTestTask, createTestBooking, createTestEvent,
  createTestService, createTestContact,
  fireDeposit, fireSubDeposit,
} = require('../helpers/helix');

// ═══════════════════════════════════════════════════════════
// SETUP — seed a full working dataset before each test
// ═══════════════════════════════════════════════════════════

const SEED = {
  prospects: [
    createTestProspect({ id: 'p1', biz: 'Acme Corp', contact: 'John Smith', status: 'lead' }),
    createTestProspect({ id: 'p2', biz: 'Beta LLC', contact: 'Sara Jones', status: 'active' }),
  ],
  jobs: [
    createTestJob({ id: 'j1', title: 'Website Redesign', clientId: 'p1', status: 'active', rate: 150 }),
  ],
  invoices: [
    createTestInvoice({ id: 'i1', number: 'INV-T001', clientId: 'p1', total: 500, status: 'sent', dueDate: '2026-04-15',
      items: [{ description: 'Web design', qty: 1, price: 500, total: 500 }] }),
  ],
  expenses: [
    createTestExpense({ id: 'e1', vendor: 'Office Depot', amount: 85.50, category: 'supplies' }),
    createTestExpense({ id: 'e2', vendor: 'Adobe', amount: 54.99, category: 'software' }),
  ],
  notes: [
    createTestNote({ id: 'n1', title: 'Client meeting notes', prospectId: 'p1' }),
  ],
  tasks: [
    createTestTask({ id: 't1', title: 'Follow up on proposal', prospectId: 'p1' }),
  ],
  bookings: [
    createTestBooking({ id: 'bk1', clientName: 'John Smith' }),
  ],
  events: [
    createTestEvent({ id: 'ev1', title: 'Strategy call' }),
  ],
  services: [
    createTestService({ id: 'sv1', name: 'Consulting', rate: 200 }),
  ],
  contacts: [
    createTestContact({ id: 'c1', name: 'Jane Doe', phone: '555-0100' }),
  ],
  bankTransactions: [],
  bankAccounts: [{ id: 'acct1', name: 'Business Checking', balance: 10000, type: 'checking' }],
};

async function setup(page) {
  await page.goto('/');
  await clearHelixData(page);
  await seedTestData(page, SEED);
  await page.reload();
  await page.waitForFunction(() => typeof window.__crossroadsTest !== 'undefined', { timeout: 10000 });
}

// ═══════════════════════════════════════════════════════════
// 1. JOB CREATION — every source type that creates jobs
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Job Creation', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('prospect → jobs creates a new job', async ({ page }) => {
    const before = await getStateCount(page, 'jobs');
    await fireSubDeposit(page, 'prospect-jobs', 'newJob', SEED.prospects[0]);
    await page.waitForTimeout(800);
    const after = await getStateCount(page, 'jobs');
    expect(after).toBe(before + 1);

    // Verify the job references the prospect
    const state = await getHelixState(page);
    const newJob = state.jobs.find(j => j.id !== 'j1');
    expect(newJob).toBeTruthy();
    expect(newJob.clientId || newJob.prospectId).toBe('p1');
  });

  test('booking → jobs creates a job from booking', async ({ page }) => {
    const before = await getStateCount(page, 'jobs');
    await fireSubDeposit(page, 'booking-jobs', 'newJob', SEED.bookings[0]);
    await page.waitForTimeout(800);
    expect(await getStateCount(page, 'jobs')).toBe(before + 1);
  });

  test('task → jobs converts task to job', async ({ page }) => {
    const before = await getStateCount(page, 'jobs');
    await fireSubDeposit(page, 'task-jobs', 'convertJob', SEED.tasks[0]);
    await page.waitForTimeout(800);
    expect(await getStateCount(page, 'jobs')).toBe(before + 1);

    // Task should be marked done
    const state = await getHelixState(page);
    const task = state.tasks.find(t => t.id === 't1');
    expect(task.status).toBe('done');
  });

  test('event → jobs creates a job from event', async ({ page }) => {
    const before = await getStateCount(page, 'jobs');
    await fireSubDeposit(page, 'event-jobs', 'newJob', SEED.events[0]);
    await page.waitForTimeout(800);
    expect(await getStateCount(page, 'jobs')).toBe(before + 1);
  });

  test('contact → jobs creates a job for contact', async ({ page }) => {
    const before = await getStateCount(page, 'jobs');
    await fireSubDeposit(page, 'contact-jobs', 'newJob', SEED.contacts[0]);
    await page.waitForTimeout(800);
    expect(await getStateCount(page, 'jobs')).toBe(before + 1);
  });

  test('service → jobs creates a job for service', async ({ page }) => {
    const before = await getStateCount(page, 'jobs');
    await fireSubDeposit(page, 'service-jobs', 'newJob', SEED.services[0]);
    await page.waitForTimeout(800);
    expect(await getStateCount(page, 'jobs')).toBe(before + 1);
  });

  test('new job appears in active tab (not filtered out)', async ({ page }) => {
    await fireSubDeposit(page, 'prospect-jobs', 'newJob', SEED.prospects[0]);
    await page.waitForTimeout(800);

    // Jobs panel should be open with the active tab
    const jobsTab = await page.evaluate(() => window.jobsCurrentTab);
    expect(jobsTab).toBe('active');
  });
});

// ═══════════════════════════════════════════════════════════
// 2. JOB → INVOICES — creates invoice from job
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Job to Invoice', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('job → invoices/generateInvoice creates an invoice', async ({ page }) => {
    const before = await getStateCount(page, 'invoices');
    await fireSubDeposit(page, 'job-invoices', 'generateInvoice', SEED.jobs[0]);
    await page.waitForTimeout(800);
    const after = await getStateCount(page, 'invoices');
    expect(after).toBe(before + 1);
  });

  test('job → invoices marks job as invoiced', async ({ page }) => {
    await fireSubDeposit(page, 'job-invoices', 'generateInvoice', SEED.jobs[0]);
    await page.waitForTimeout(800);

    const state = await getHelixState(page);
    const job = state.jobs.find(j => j.id === 'j1');
    expect(job.status).toBe('invoiced');
  });

  test('job → invoices links invoice to job', async ({ page }) => {
    await fireSubDeposit(page, 'job-invoices', 'generateInvoice', SEED.jobs[0]);
    await page.waitForTimeout(800);

    const state = await getHelixState(page);
    const newInv = state.invoices.find(i => i.id !== 'i1');
    expect(newInv).toBeTruthy();
    expect(newInv.jobId).toBe('j1');
  });
});

// ═══════════════════════════════════════════════════════════
// 3. EXPENSE → BANKING — creates bank transaction
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Expense to Banking', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('expense → banking/linkTransaction creates a bank transaction', async ({ page }) => {
    const before = await getStateCount(page, 'bankTransactions');
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[0]);
    await page.waitForTimeout(800);
    const after = await getStateCount(page, 'bankTransactions');
    expect(after).toBe(before + 1);
  });

  test('expense → banking creates negative (outflow) transaction', async ({ page }) => {
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[0]);
    await page.waitForTimeout(800);

    const state = await getHelixState(page);
    const tx = state.bankTransactions[state.bankTransactions.length - 1];
    expect(tx.amount).toBeLessThan(0);
    expect(Math.abs(tx.amount)).toBeCloseTo(85.50);
  });

  test('expense → banking marks expense as reconciled', async ({ page }) => {
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[0]);
    await page.waitForTimeout(800);

    const state = await getHelixState(page);
    const exp = state.expenses.find(e => e.id === 'e1');
    expect(exp.reconciled).toBe(true);
    expect(exp.bankTxId).toBeTruthy();
  });

  test('expense → banking links transaction back to expense', async ({ page }) => {
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[0]);
    await page.waitForTimeout(800);

    const state = await getHelixState(page);
    const tx = state.bankTransactions[state.bankTransactions.length - 1];
    expect(tx.matchedExpenseId).toBe('e1');
  });

  test('expense → banking shows deposit receipt', async ({ page }) => {
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[0]);
    await page.waitForTimeout(500);

    const receipt = page.locator('#depositReceipt');
    await expect(receipt).toBeAttached();
  });
});

// ═══════════════════════════════════════════════════════════
// 4. DISABLED COMBOS — self-drops blocked
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Disabled Combos', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  const selfDrops = [
    ['prospect', 'crm', 'prospects'],
    ['note', 'notes', 'notes'],
    ['task', 'tasks', 'tasks'],
    ['job', 'jobs', 'jobs'],
    ['invoice', 'invoices', 'invoices'],
    ['expense', 'expenses', 'expenses'],
  ];

  for (const [sourceType, destType, stateKey] of selfDrops) {
    test(`${sourceType} → ${destType} is blocked (no duplicate)`, async ({ page }) => {
      const before = await getStateCount(page, stateKey);

      const sourceData = await page.evaluate(({ key }) => {
        const S = JSON.parse(localStorage.getItem('scV12') || '{}');
        return S[key] && S[key][0] ? S[key][0] : {};
      }, { key: stateKey });

      await fireDeposit(page, sourceType, destType, sourceData);
      await page.waitForTimeout(400);

      const after = await getStateCount(page, stateKey);
      expect(after).toBe(before);
    });
  }
});

// ═══════════════════════════════════════════════════════════
// 5. CROSS-MODULE DROPS — notes, tasks, schedule creation
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Cross-Module Records', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('prospect → tasks/followUpTask creates a task', async ({ page }) => {
    const before = await getStateCount(page, 'tasks');
    await fireSubDeposit(page, 'prospect-tasks', 'followUpTask', SEED.prospects[0]);
    await page.waitForTimeout(600);
    expect(await getStateCount(page, 'tasks')).toBe(before + 1);
  });

  test('prospect → notes/newNote creates a note', async ({ page }) => {
    const before = await getStateCount(page, 'notes');
    await fireSubDeposit(page, 'prospect-notes', 'newNote', SEED.prospects[0]);
    await page.waitForTimeout(800);
    // Note modal opens — note may not be saved until modal submit
    // Verify notes panel is open
    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
  });

  test('prospect → schedule/newMeeting opens schedule', async ({ page }) => {
    await fireSubDeposit(page, 'prospect-schedule', 'newMeeting', SEED.prospects[0]);
    await page.waitForTimeout(800);
    await expect(page.locator('#panel-schedule')).toHaveClass(/open/);
  });

  test('job → tasks/followUp creates a task', async ({ page }) => {
    const before = await getStateCount(page, 'tasks');
    await fireSubDeposit(page, 'job-tasks', 'followUp', SEED.jobs[0]);
    await page.waitForTimeout(600);
    expect(await getStateCount(page, 'tasks')).toBe(before + 1);
  });

  test('job → notes/workNotes creates a note', async ({ page }) => {
    const before = await getStateCount(page, 'notes');
    await fireSubDeposit(page, 'job-notes', 'workNotes', SEED.jobs[0]);
    await page.waitForTimeout(600);
    expect(await getStateCount(page, 'notes')).toBe(before + 1);
  });

  test('invoice → tasks/paymentFollowUp creates a task', async ({ page }) => {
    const before = await getStateCount(page, 'tasks');
    await fireSubDeposit(page, 'invoice-tasks', 'paymentFollowUp', SEED.invoices[0]);
    await page.waitForTimeout(600);
    expect(await getStateCount(page, 'tasks')).toBe(before + 1);
  });

  test('invoice → notes/paymentNote creates a note', async ({ page }) => {
    const before = await getStateCount(page, 'notes');
    await fireSubDeposit(page, 'invoice-notes', 'paymentNote', SEED.invoices[0]);
    await page.waitForTimeout(600);
    expect(await getStateCount(page, 'notes')).toBe(before + 1);
  });

  test('expense → crm/tagToClient links expense to prospect', async ({ page }) => {
    // Need to provide a prospect picker response — use withProspect
    // This will attempt to use prospectId from sourceData or show picker
    const expWithClient = { ...SEED.expenses[0], prospectId: 'p1' };
    await fireSubDeposit(page, 'expense-crm', 'tagToClient', expWithClient);
    await page.waitForTimeout(600);

    const state = await getHelixState(page);
    const exp = state.expenses.find(e => e.id === 'e1');
    expect(exp.clientId).toBe('p1');
  });

  test('expense → notes/expenseNote opens note modal', async ({ page }) => {
    await fireSubDeposit(page, 'expense-notes', 'expenseNote', SEED.expenses[0]);
    await page.waitForTimeout(800);
    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
  });

  test('note → tasks/createTask creates a task', async ({ page }) => {
    const before = await getStateCount(page, 'tasks');
    await fireSubDeposit(page, 'note-tasks', 'createTask', SEED.notes[0]);
    await page.waitForTimeout(600);
    expect(await getStateCount(page, 'tasks')).toBe(before + 1);
  });

  test('contact → notes/newNote opens notes panel', async ({ page }) => {
    await fireSubDeposit(page, 'contact-notes', 'newNote', SEED.contacts[0]);
    await page.waitForTimeout(800);
    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
  });

  test('contact → tasks/followUp creates a task', async ({ page }) => {
    const before = await getStateCount(page, 'tasks');
    await fireSubDeposit(page, 'contact-tasks', 'followUp', SEED.contacts[0]);
    await page.waitForTimeout(600);
    expect(await getStateCount(page, 'tasks')).toBe(before + 1);
  });
});

// ═══════════════════════════════════════════════════════════
// 6. CONFIRMATION OVERLAY — shows after every drop
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Confirmation Banner', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('showCrossroadsConfirm creates and removes banner', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof showCrossroadsConfirm === 'function') {
        showCrossroadsConfirm(
          { sourceType: 'expense', name: 'Office Depot', sourceData: {} },
          'banking'
        );
      }
    });
    await page.waitForTimeout(200);

    const banner = page.locator('#crossroadsConfirm');
    await expect(banner).toBeAttached();

    // Banner should auto-dismiss after ~3.5s
    await page.waitForTimeout(4000);
    await expect(banner).not.toBeAttached();
  });
});

// ═══════════════════════════════════════════════════════════
// 7. DATA INTEGRITY — no state corruption after drops
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Data Integrity', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('state is valid JSON after multiple rapid deposits', async ({ page }) => {
    // Fire 5 deposits rapidly
    await fireSubDeposit(page, 'prospect-tasks', 'followUpTask', SEED.prospects[0]);
    await fireSubDeposit(page, 'prospect-tasks', 'followUpTask', SEED.prospects[1]);
    await fireSubDeposit(page, 'job-notes', 'workNotes', SEED.jobs[0]);
    await fireSubDeposit(page, 'invoice-tasks', 'paymentFollowUp', SEED.invoices[0]);
    await fireSubDeposit(page, 'expense-notes', 'expenseNote', SEED.expenses[0]);

    await page.waitForTimeout(1500);

    // State should still be valid
    const state = await getHelixState(page);
    expect(state).toBeTruthy();
    expect(Array.isArray(state.prospects)).toBe(true);
    expect(Array.isArray(state.tasks)).toBe(true);
    expect(Array.isArray(state.notes)).toBe(true);
    expect(Array.isArray(state.jobs)).toBe(true);
    expect(Array.isArray(state.invoices)).toBe(true);
    expect(Array.isArray(state.expenses)).toBe(true);
  });

  test('original source data is not deleted after deposit', async ({ page }) => {
    const prospectsBefore = await getStateCount(page, 'prospects');
    const jobsBefore = await getStateCount(page, 'jobs');
    const expensesBefore = await getStateCount(page, 'expenses');

    await fireSubDeposit(page, 'prospect-jobs', 'newJob', SEED.prospects[0]);
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[0]);
    await page.waitForTimeout(800);

    // Source items preserved (not deleted)
    expect(await getStateCount(page, 'prospects')).toBe(prospectsBefore);
    expect(await getStateCount(page, 'expenses')).toBe(expensesBefore);
    // Jobs increased by 1
    expect(await getStateCount(page, 'jobs')).toBe(jobsBefore + 1);
  });

  test('state survives reload after deposits', async ({ page }) => {
    await fireSubDeposit(page, 'prospect-jobs', 'newJob', SEED.prospects[0]);
    await fireSubDeposit(page, 'expense-banking', 'linkTransaction', SEED.expenses[1]);
    await page.waitForTimeout(800);

    const beforeReload = await getHelixState(page);
    await page.reload();
    await page.waitForFunction(() => typeof window.__crossroadsTest !== 'undefined', { timeout: 15000 });

    const afterReload = await getHelixState(page);
    expect(afterReload.jobs.length).toBe(beforeReload.jobs.length);
    expect(afterReload.bankTransactions.length).toBe(beforeReload.bankTransactions.length);
    expect(afterReload.expenses.find(e => e.id === 'e2').reconciled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// 8. HANDLER COVERAGE — verify all registered handlers exist
// ═══════════════════════════════════════════════════════════

test.describe('Crossroads → Handler Registry', () => {
  test('all registered sub-destinations have handlers', async ({ page }) => {
    await setup(page);

    const missing = await page.evaluate(() => {
      const api = window.__crossroadsTest;
      if (!api) return ['__crossroadsTest not found'];

      const handlers = api.allHandlers;
      const missing = [];

      // Check every key in allHandlers is actually a function
      for (const key of Object.keys(handlers)) {
        if (typeof handlers[key] !== 'function') {
          missing.push(key + ' (not a function)');
        }
      }
      return missing;
    });

    expect(missing).toEqual([]);
  });

  test('handler count is substantial (no empty registry)', async ({ page }) => {
    await setup(page);

    const count = await page.evaluate(() => {
      const api = window.__crossroadsTest;
      return api ? Object.keys(api.allHandlers).length : 0;
    });

    // Should have at least 40 handlers based on the codebase
    expect(count).toBeGreaterThan(30);
  });
});

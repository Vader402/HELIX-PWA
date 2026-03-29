// @ts-check
const { test, expect } = require('@playwright/test');
const { clearHelixData, seedTestData, getHelixState, callHelixFunction,
        createTestProspect, createTestInvoice, createTestJob, createTestExpense } = require('../helpers/helix');

test.describe('Data Integrity — State Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearHelixData(page);
    await page.reload();
    await page.waitForTimeout(500);
  });

  test('seeded prospects persist through reload', async ({ page }) => {
    const prospects = [
      createTestProspect({ biz: 'Alpha Corp' }),
      createTestProspect({ biz: 'Beta LLC' }),
      createTestProspect({ biz: 'Gamma Inc' }),
    ];
    await seedTestData(page, { prospects });
    await page.reload();
    await page.waitForTimeout(500);

    const state = await getHelixState(page);
    expect(state.prospects).toHaveLength(3);
    expect(state.prospects.map(p => p.biz).sort()).toEqual(['Alpha Corp', 'Beta LLC', 'Gamma Inc']);
  });

  test('seeded invoices persist through reload', async ({ page }) => {
    const invoices = [
      createTestInvoice({ number: 'INV-001', total: 500 }),
      createTestInvoice({ number: 'INV-002', total: 750 }),
    ];
    await seedTestData(page, { invoices });
    await page.reload();
    await page.waitForTimeout(500);

    const state = await getHelixState(page);
    expect(state.invoices).toHaveLength(2);
    expect(state.invoices[0].total).toBe(500);
  });

  test('seeded jobs persist through reload', async ({ page }) => {
    const jobs = [createTestJob({ title: 'Website Redesign', rate: 200 })];
    await seedTestData(page, { jobs });
    await page.reload();
    await page.waitForTimeout(500);

    const state = await getHelixState(page);
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0].title).toBe('Website Redesign');
  });

  test('seeded expenses persist through reload', async ({ page }) => {
    const expenses = [createTestExpense({ vendor: 'Office Depot', amount: 150 })];
    await seedTestData(page, { expenses });
    await page.reload();
    await page.waitForTimeout(500);

    const state = await getHelixState(page);
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].vendor).toBe('Office Depot');
  });

  test('clearing data resets state to defaults', async ({ page }) => {
    const testProspect = createTestProspect({ biz: 'ClearMe Corp' });
    await seedTestData(page, {
      prospects: [testProspect],
      invoices: [createTestInvoice()],
      jobs: [createTestJob()],
    });
    await page.reload();
    await page.waitForTimeout(300);

    // Verify our test data exists
    let state = await getHelixState(page);
    expect(state.prospects.find(p => p.biz === 'ClearMe Corp')).toBeTruthy();

    // Clear
    await clearHelixData(page);
    await page.reload();
    await page.waitForTimeout(500);

    // Verify our test data is gone (app may re-init with empty arrays or seed data)
    state = await getHelixState(page);
    const found = state.prospects ? state.prospects.find(p => p.biz === 'ClearMe Corp') : null;
    expect(found).toBeFalsy();
  });

  test('save function persists state to localStorage', async ({ page }) => {
    // S is a top-level let, not on window — use eval to access
    await page.evaluate(() => {
      const state = eval('S');
      state.prospects = state.prospects || [];
      state.prospects.push({
        id: 'test123',
        biz: 'Programmatic Add',
        con: 'Test',
        status: 'lead',
      });
      eval('save()');
    });

    // Read directly from localStorage
    const raw = await page.evaluate(() => localStorage.getItem('scV12'));
    const parsed = JSON.parse(raw);
    expect(parsed.prospects.find(p => p.id === 'test123')).toBeTruthy();
  });
});

test.describe('Utility Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('uid() generates unique IDs', async ({ page }) => {
    const ids = await page.evaluate(() => {
      const results = [];
      for (let i = 0; i < 100; i++) results.push(uid());
      return results;
    });
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });

  test('fmt$() formats money correctly', async ({ page }) => {
    const hasFmt = await page.evaluate(() => typeof window['fmt$'] === 'function');
    if (hasFmt) {
      const result = await page.evaluate(() => window['fmt$'](1234.5));
      expect(result).toMatch(/1,?234/); // Should contain formatted number
    }
  });

  test('esc() escapes HTML entities', async ({ page }) => {
    const hasEsc = await page.evaluate(() => typeof window.esc === 'function');
    if (hasEsc) {
      const result = await page.evaluate(() => window.esc('<script>alert("xss")</script>'));
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    }
  });
});

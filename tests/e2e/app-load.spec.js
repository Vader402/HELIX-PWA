// @ts-check
const { test, expect } = require('@playwright/test');
const { clearHelixData, waitForHelixReady, getHelixState } = require('../helpers/helix');

test.describe('App Load & Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearHelixData(page);
    await page.reload();
  });

  test('app loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('global state object S exists after load', async ({ page }) => {
    // S is a top-level let, not on window — use eval to access it
    await page.waitForFunction(() => {
      try { return typeof eval('S') !== 'undefined'; } catch(e) { return false; }
    }, { timeout: 10000 });
    const hasState = await page.evaluate(() => {
      try { return typeof eval('S') === 'object'; } catch(e) { return false; }
    });
    expect(hasState).toBe(true);
  });

  test('Layer 1 buttons are visible', async ({ page }) => {
    await page.waitForSelector('#L1', { timeout: 5000 });
    const buttons = ['#bCRM', '#bNotes', '#bMis', '#bEml'];
    for (const btn of buttons) {
      await expect(page.locator(btn)).toBeVisible();
    }
  });

  test('Layer 2 buttons exist in DOM', async ({ page }) => {
    const buttons = ['#bJobs', '#bInvoices', '#bExpenses'];
    for (const btn of buttons) {
      await expect(page.locator(btn)).toBeAttached();
    }
  });

  test('localStorage state is created on first load', async ({ page }) => {
    await page.waitForTimeout(1000);
    const state = await getHelixState(page);
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
  });

  test('panels exist in DOM', async ({ page }) => {
    const panels = ['#panel-crm', '#panel-notes', '#panel-missions', '#panel-email',
                     '#panel-jobs', '#panel-invoices', '#panel-expenses', '#panel-vault'];
    for (const panel of panels) {
      await expect(page.locator(panel)).toBeAttached();
    }
  });
});

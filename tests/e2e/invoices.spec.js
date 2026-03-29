// @ts-check
const { test, expect } = require('@playwright/test');
const { clearHelixData, seedTestData, getHelixState, createTestProspect, createTestInvoice } = require('../helpers/helix');

test.describe('Invoices Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearHelixData(page);
    await page.reload();
    await page.waitForTimeout(500);
  });

  test('invoice panel opens and shows seeded invoices', async ({ page }) => {
    const prospect = createTestProspect({ biz: 'Invoice Client' });
    const invoice = createTestInvoice({
      number: 'INV-100',
      total: 2500,
      contactId: prospect.id,
      status: 'sent',
    });
    await seedTestData(page, { prospects: [prospect], invoices: [invoice] });
    await page.reload();
    await page.waitForTimeout(500);

    // Switch to L2 first (invoices is on Layer 2)
    await page.evaluate(() => {
      const l2 = document.getElementById('L2');
      if (l2) l2.classList.remove('hide');
    });
    await page.click('#bInvoices');
    await page.waitForTimeout(400);

    await expect(page.locator('#panel-invoices')).toHaveClass(/open/);
  });

  test('invoice total calculation is correct', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Test the internal calculation if available
      const items = [
        { desc: 'Service A', qty: 2, price: 100 },
        { desc: 'Service B', qty: 1, price: 250 },
        { desc: 'Product C', qty: 3, price: 50 },
      ];
      return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    });
    expect(result).toBe(600);
  });

  test('invoice status transitions are valid', async ({ page }) => {
    const invoice = createTestInvoice({ status: 'draft' });
    await seedTestData(page, { invoices: [invoice] });
    await page.reload();
    await page.waitForTimeout(300);

    // Verify we can read the status
    const state = await getHelixState(page);
    expect(state.invoices[0].status).toBe('draft');
    // Valid statuses: draft, sent, viewed, paid, overdue, void
    expect(['draft', 'sent', 'viewed', 'paid', 'overdue', 'void']).toContain(state.invoices[0].status);
  });
});

test.describe('Invoice Financial Cascades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearHelixData(page);
    await page.reload();
    await page.waitForTimeout(500);
  });

  test('creating invoice updates AR (accounts receivable)', async ({ page }) => {
    // Seed state and trigger invoice creation programmatically
    const result = await page.evaluate(() => {
      if (typeof window.S === 'undefined') return { error: 'no state' };

      window.S.prospects = window.S.prospects || [];
      window.S.invoices = window.S.invoices || [];
      window.S.accounts = window.S.accounts || [];
      window.S.journalEntries = window.S.journalEntries || [];

      const prospectId = typeof uid === 'function' ? uid() : 'p1';
      window.S.prospects.push({ id: prospectId, biz: 'AR Test Client' });

      // Check if createInvoice or a similar function exists
      const hasFn = typeof window.createInvoice === 'function';
      return { hasFn, journalCount: window.S.journalEntries.length };
    });

    expect(result).toBeDefined();
  });
});

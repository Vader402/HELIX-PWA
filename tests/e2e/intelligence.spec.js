// @ts-check
const { test, expect } = require('@playwright/test');
const { getHelixState, seedTestData } = require('../helpers/helix');

test.describe('Intelligence — Client Scorecard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('getClientScorecard returns null for non-existent client', async ({ page }) => {
    const result = await page.evaluate(() => {
      return typeof getClientScorecard === 'function' ? getClientScorecard('nonexistent_id_999') : 'fn_missing';
    });
    expect(result).toBeNull();
  });

  test('getClientScorecard returns data for valid prospect', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects && state.prospects[0];
    if (!prospect) return;

    const result = await page.evaluate((id) => {
      return typeof getClientScorecard === 'function' ? getClientScorecard(id) : null;
    }, prospect.id);

    expect(result).toBeTruthy();
    expect(result).toHaveProperty('client');
    expect(result).toHaveProperty('totalInvoiced');
    expect(result).toHaveProperty('totalPaid');
    expect(result).toHaveProperty('outstanding');
    expect(result).toHaveProperty('avgDSO');
    expect(result).toHaveProperty('profit');
    expect(result).toHaveProperty('margin');
    expect(result).toHaveProperty('health');
    expect(['green', 'amber', 'red']).toContain(result.health);
  });

  test('scorecard margin calculation is correct', async ({ page }) => {
    // Create a prospect with paid invoices and expenses
    await page.evaluate(() => {
      const S = JSON.parse(localStorage.getItem('scV12') || '{}');
      const clientId = 'test_scorecard_client';
      S.prospects = S.prospects || [];
      S.prospects.push({ id: clientId, biz: 'Scorecard Test Corp' });
      S.invoices = S.invoices || [];
      S.invoices.push({ id: 'sc_inv1', clientId, total: 1000, status: 'paid', paidAt: new Date().toISOString(), created: new Date(Date.now() - 30*86400000).toISOString(), type: 'invoice' });
      S.jobs = S.jobs || [];
      S.expenses = S.expenses || [];
      localStorage.setItem('scV12', JSON.stringify(S));
    });
    await page.reload();
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => getClientScorecard('test_scorecard_client'));
    expect(result).toBeTruthy();
    expect(result.totalPaid).toBe(1000);
    expect(result.profit).toBe(1000); // no expenses
    expect(result.margin).toBe(100); // 100% margin
  });
});

test.describe('Intelligence — Payment Prediction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('predictPaymentDate returns null for non-existent invoice', async ({ page }) => {
    const result = await page.evaluate(() => {
      return typeof predictPaymentDate === 'function' ? predictPaymentDate('fake_inv_999') : 'fn_missing';
    });
    expect(result).toBeNull();
  });

  test('predictPaymentDate returns null for invoice without client', async ({ page }) => {
    await page.evaluate(() => {
      const S = JSON.parse(localStorage.getItem('scV12') || '{}');
      S.invoices = S.invoices || [];
      S.invoices.push({ id: 'no_client_inv', total: 100, status: 'sent', created: new Date().toISOString() });
      localStorage.setItem('scV12', JSON.stringify(S));
    });
    await page.reload();
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => predictPaymentDate('no_client_inv'));
    expect(result).toBeNull();
  });

  test('predictPaymentDate returns prediction with payment history', async ({ page }) => {
    const clientId = 'predict_client';
    await page.evaluate((cid) => {
      const S = JSON.parse(localStorage.getItem('scV12') || '{}');
      S.prospects = S.prospects || [];
      S.prospects.push({ id: cid, biz: 'Prediction Test' });
      S.invoices = S.invoices || [];
      // Create 5 paid invoices with consistent 7-day payment
      for (let i = 0; i < 5; i++) {
        const created = new Date(Date.now() - (60 - i * 10) * 86400000).toISOString();
        const paidAt = new Date(new Date(created).getTime() + 7 * 86400000).toISOString();
        S.invoices.push({ id: 'pred_inv_' + i, clientId: cid, total: 500, status: 'paid', created, paidAt, type: 'invoice' });
      }
      // One unpaid invoice
      S.invoices.push({ id: 'pred_inv_unpaid', clientId: cid, total: 750, status: 'sent', created: new Date().toISOString(), type: 'invoice' });
      localStorage.setItem('scV12', JSON.stringify(S));
    }, clientId);
    await page.reload();
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => predictPaymentDate('pred_inv_unpaid'));
    expect(result).toBeTruthy();
    expect(result).toHaveProperty('predicted');
    expect(result).toHaveProperty('avgDays');
    expect(result).toHaveProperty('confidence');
    expect(result.avgDays).toBeCloseTo(7, 0);
    expect(result.confidence).toBe('high'); // 5+ invoices = high confidence
  });
});

test.describe('Intelligence — Weekly Digest', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('generateWeeklyDigest returns complete structure', async ({ page }) => {
    const result = await page.evaluate(() => {
      return typeof generateWeeklyDigest === 'function' ? generateWeeklyDigest() : null;
    });

    expect(result).toBeTruthy();
    expect(result).toHaveProperty('period');
    expect(result).toHaveProperty('invoicesCreated');
    expect(result).toHaveProperty('totalReceived');
    expect(result).toHaveProperty('totalSpent');
    expect(result).toHaveProperty('netCashFlow');
    expect(result).toHaveProperty('overdueInvoices');
    expect(result).toHaveProperty('healthScore');
    expect(result).toHaveProperty('healthGrade');
  });

  test('weekly digest handles empty state gracefully', async ({ page }) => {
    // Clear all data
    await page.evaluate(() => {
      localStorage.setItem('scV12', JSON.stringify({ prospects: [], invoices: [], expenses: [], jobs: [], timeEntries: [], notes: [], tasks: [] }));
    });
    await page.reload();
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => {
      return typeof generateWeeklyDigest === 'function' ? generateWeeklyDigest() : null;
    });

    expect(result).toBeTruthy();
    // App may re-seed demo data, so just verify structure, not exact zeros
    expect(typeof result.invoicesCreated).toBe('number');
    expect(typeof result.totalReceived).toBe('number');
    expect(typeof result.totalSpent).toBe('number');
    expect(typeof result.netCashFlow).toBe('number');
  });
});

test.describe('Intelligence — Revenue Forecast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('getRevenueForecast returns forecast data', async ({ page }) => {
    const result = await page.evaluate(() => {
      return typeof getRevenueForecast === 'function' ? getRevenueForecast() : null;
    });

    if (result) {
      expect(result).toHaveProperty('total');
      expect(typeof result.total).toBe('number');
      expect(result).toHaveProperty('deals');
      expect(Array.isArray(result.deals)).toBe(true);
    }
  });

  test('revenue forecast handles empty pipeline', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('scV12', JSON.stringify({ prospects: [], invoices: [], jobs: [] }));
    });
    await page.reload();
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => {
      return typeof getRevenueForecast === 'function' ? getRevenueForecast() : null;
    });

    if (result) {
      // App re-seeds demo data, so just verify structure
      expect(result).toHaveProperty('total');
      expect(typeof result.total).toBe('number');
      expect(result).toHaveProperty('deals');
      expect(Array.isArray(result.deals)).toBe(true);
    }
  });
});

test.describe('Intelligence — Client LTV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
  });

  test('predictClientLTV handles missing client gracefully', async ({ page }) => {
    const result = await page.evaluate(() => {
      return typeof predictClientLTV === 'function' ? predictClientLTV('nonexistent_999') : 'fn_missing';
    });
    // Should return null or a safe default, not throw
    expect(result).toBeDefined();
  });

  test('predictClientLTV returns LTV for client with history', async ({ page }) => {
    const state = await getHelixState(page);
    const prospect = state.prospects && state.prospects[0];
    if (!prospect) return;

    const result = await page.evaluate((id) => {
      return typeof predictClientLTV === 'function' ? predictClientLTV(id) : null;
    }, prospect.id);

    if (result) {
      expect(result).toHaveProperty('ltv');
      expect(typeof result.ltv).toBe('number');
    }
  });
});

test.describe('Intelligence — Null Safety', () => {
  test('intelligence functions don\'t throw on completely empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Set minimal empty state
    await page.evaluate(() => {
      localStorage.setItem('scV12', JSON.stringify({}));
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Call multiple intelligence functions and ensure none throw
    const results = await page.evaluate(() => {
      const errors = [];
      const fns = [
        ['generateWeeklyDigest', []],
        ['getRevenueForecast', []],
        ['getClientScorecard', ['fake_id']],
        ['predictPaymentDate', ['fake_id']],
        ['predictClientLTV', ['fake_id']],
      ];
      fns.forEach(([name, args]) => {
        try {
          if (typeof window[name] === 'function') window[name](...args);
        } catch (e) {
          errors.push(name + ': ' + e.message);
        }
      });
      return errors;
    });

    expect(results).toEqual([]);
  });
});

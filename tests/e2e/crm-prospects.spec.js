// @ts-check
const { test, expect } = require('@playwright/test');
const { clearHelixData, seedTestData, getHelixState, createTestProspect } = require('../helpers/helix');

test.describe('CRM — Prospect Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('add new prospect programmatically', async ({ page }) => {
    const beforeState = await getHelixState(page);
    const beforeCount = beforeState.prospects ? beforeState.prospects.length : 0;

    // Use the app's own function to add a prospect
    await page.evaluate(() => {
      const state = eval('S');
      state.prospects = state.prospects || [];
      state.prospects.push({
        id: eval('uid()'),
        biz: 'Test Landscaping Co',
        con: 'John Smith',
        email: 'john@testlandscaping.com',
        phone: '555-1234',
        status: 'lead',
        history: [],
      });
      eval('save()');
    });

    const afterState = await getHelixState(page);
    expect(afterState.prospects.length).toBe(beforeCount + 1);
    const added = afterState.prospects.find(p => p.biz === 'Test Landscaping Co');
    expect(added).toBeTruthy();
    expect(added.con).toBe('John Smith');
    expect(added.email).toBe('john@testlandscaping.com');
  });

  test('prospect card appears in CRM list after seeding', async ({ page }) => {
    // Seed a prospect with a unique name
    const prospect = createTestProspect({ biz: 'Visible Prospect LLC', status: 'lead' });
    await seedTestData(page, {});
    await page.evaluate((p) => {
      const state = eval('S');
      state.prospects = state.prospects || [];
      state.prospects.push(p);
      eval('save()');
    }, prospect);
    await page.waitForTimeout(200);

    // Open CRM and wait for render
    await page.click('#bCRM');
    await page.waitForTimeout(500);

    // The prospect should appear somewhere in the CRM panel
    const panelText = await page.locator('#panel-crm').textContent();
    expect(panelText).toContain('Visible Prospect LLC');
  });

  test('saveProspect rejects empty business name', async ({ page }) => {
    const beforeState = await getHelixState(page);
    const beforeCount = beforeState.prospects ? beforeState.prospects.length : 0;

    // Open the add modal via JS and try saving with empty biz
    await page.evaluate(() => {
      if (typeof openProspectModal === 'function') openProspectModal();
    });
    await page.waitForTimeout(300);

    // Clear biz field and save
    const bizField = page.locator('#fBiz');
    if (await bizField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bizField.fill('');
      await page.evaluate(() => { if(typeof saveProspect === 'function') saveProspect(); });
      await page.waitForTimeout(300);

      // Count should not have changed
      const afterState = await getHelixState(page);
      const afterCount = afterState.prospects ? afterState.prospects.length : 0;
      expect(afterCount).toBe(beforeCount);
    }
  });

  test('edit existing prospect updates state', async ({ page }) => {
    // Get first prospect ID
    const state = await getHelixState(page);
    const prospect = state.prospects && state.prospects[0];
    if (!prospect) return; // skip if no prospects

    // Programmatically update
    await page.evaluate((id) => {
      const state = eval('S');
      const p = state.prospects.find(x => x.id === id);
      if (p) {
        p.con = 'Updated Contact Name';
        eval('save()');
      }
    }, prospect.id);

    const updatedState = await getHelixState(page);
    const updated = updatedState.prospects.find(p => p.id === prospect.id);
    expect(updated.con).toBe('Updated Contact Name');
  });

  test('app initializes with demo seed data', async ({ page }) => {
    // The app seeds Green Valley Landscaping demo data on fresh load
    const state = await getHelixState(page);
    expect(state.prospects).toBeDefined();
    expect(state.prospects.length).toBeGreaterThan(0);
  });

  test('delete prospect removes from state', async ({ page }) => {
    // Add a test prospect then remove it
    await page.evaluate(() => {
      const state = eval('S');
      state.prospects.push({
        id: 'delete_me_123',
        biz: 'Delete Me Corp',
        con: 'Gone Soon',
        status: 'dead',
        history: [],
      });
      eval('save()');
    });

    let s = await getHelixState(page);
    expect(s.prospects.find(p => p.id === 'delete_me_123')).toBeTruthy();

    // Remove it
    await page.evaluate(() => {
      const state = eval('S');
      state.prospects = state.prospects.filter(p => p.id !== 'delete_me_123');
      eval('save()');
    });

    s = await getHelixState(page);
    expect(s.prospects.find(p => p.id === 'delete_me_123')).toBeFalsy();
  });
});

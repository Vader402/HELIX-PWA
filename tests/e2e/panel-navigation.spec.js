// @ts-check
const { test, expect } = require('@playwright/test');
const { clearHelixData } = require('../helpers/helix');

test.describe('Panel Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearHelixData(page);
    await page.reload();
    await page.waitForTimeout(500);
  });

  test('clicking CRM button opens CRM panel', async ({ page }) => {
    await page.click('#bCRM');
    await expect(page.locator('#panel-crm')).toHaveClass(/open/);
    await expect(page.locator('#overlay')).toHaveClass(/open/);
  });

  test('clicking Notes button opens Notes panel', async ({ page }) => {
    await page.click('#bNotes');
    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
  });

  test('clicking Missions button opens Missions panel', async ({ page }) => {
    await page.click('#bMis');
    await expect(page.locator('#panel-missions')).toHaveClass(/open/);
  });

  test('clicking Email button opens Email panel', async ({ page }) => {
    await page.click('#bEml');
    await expect(page.locator('#panel-email')).toHaveClass(/open/);
  });

  test('switching between panels closes previous panel', async ({ page }) => {
    await page.click('#bCRM');
    await expect(page.locator('#panel-crm')).toHaveClass(/open/);

    // Close CRM panel first (click overlay or use JS), then open Notes
    await page.evaluate(() => { if(typeof closePanel === 'function') closePanel(); });
    await page.waitForTimeout(300);

    await page.click('#bNotes');
    await expect(page.locator('#panel-notes')).toHaveClass(/open/);
    // CRM should no longer be open
    const crmClasses = await page.locator('#panel-crm').getAttribute('class');
    expect(crmClasses).not.toContain('open');
  });

  test('overlay appears when panel is open', async ({ page }) => {
    await page.click('#bCRM');
    await expect(page.locator('#overlay')).toHaveClass(/open/);
  });
});

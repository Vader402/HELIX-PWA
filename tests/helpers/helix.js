// Helix test utilities — helpers for Playwright E2E tests

/**
 * Clear all Helix data (localStorage + IndexedDB)
 */
async function clearHelixData(page) {
  await page.evaluate(() => {
    localStorage.clear();
    const dbs = ['helix'];
    dbs.forEach(name => { try { indexedDB.deleteDatabase(name); } catch(e) {} });
  });
}

/**
 * Seed test data into the Helix state object (S) via localStorage
 * @param {import('@playwright/test').Page} page
 * @param {object} stateOverrides - properties to merge into S
 */
async function seedTestData(page, stateOverrides) {
  await page.evaluate((overrides) => {
    const key = 'scV12';
    let S = {};
    try { S = JSON.parse(localStorage.getItem(key)) || {}; } catch(e) {}
    Object.assign(S, overrides);
    localStorage.setItem(key, JSON.stringify(S));
  }, stateOverrides);
}

/**
 * Get the full Helix state object from localStorage
 */
async function getHelixState(page) {
  return await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('scV12')) || {};
    } catch(e) {
      return {};
    }
  });
}

/**
 * Call a global Helix function by name
 * @param {import('@playwright/test').Page} page
 * @param {string} fnName - global function name
 * @param {...any} args - arguments to pass
 */
async function callHelixFunction(page, fnName, ...args) {
  return await page.evaluate(({ fn, a }) => {
    if (typeof window[fn] === 'function') {
      return window[fn](...a);
    }
    throw new Error('Function not found: ' + fn);
  }, { fn: fnName, a: args });
}

/**
 * Wait for Helix app to fully initialize (panels rendered, state loaded)
 */
async function waitForHelixReady(page) {
  await page.waitForFunction(() => {
    return typeof window.S !== 'undefined' && document.querySelector('.panel');
  }, { timeout: 10000 });
}

/**
 * Open a specific panel by clicking its button
 */
async function openPanel(page, panelName) {
  const btnMap = {
    crm: '#bCRM', email: '#bEmail', tasks: '#bMissions', notes: '#bNotes',
    jobs: '#bJobs', invoices: '#bInvoices', expenses: '#bExpenses', banking: '#bBanking',
    vault: '#bSimpl',
  };
  const selector = btnMap[panelName];
  if (selector) {
    await page.click(selector);
    await page.waitForTimeout(300); // panel transition
  }
}

/**
 * Get count of items in a state array
 */
async function getStateCount(page, key) {
  return await page.evaluate((k) => {
    const S = JSON.parse(localStorage.getItem('scV12') || '{}');
    return Array.isArray(S[k]) ? S[k].length : 0;
  }, key);
}

/**
 * Generate seed data for common test scenarios
 */
function createTestProspect(overrides = {}) {
  return {
    id: 'test_' + Math.random().toString(36).substr(2, 9),
    biz: 'Test Business LLC',
    contact: 'Jane Doe',
    email: 'jane@testbiz.com',
    phone: '555-0100',
    status: 'lead',
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestInvoice(overrides = {}) {
  return {
    id: 'inv_' + Math.random().toString(36).substr(2, 9),
    number: 'INV-001',
    contactId: null,
    items: [{ desc: 'Test Service', qty: 1, price: 100 }],
    total: 100,
    status: 'draft',
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestJob(overrides = {}) {
  return {
    id: 'job_' + Math.random().toString(36).substr(2, 9),
    title: 'Test Job',
    status: 'active',
    rate: 150,
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestExpense(overrides = {}) {
  return {
    id: 'exp_' + Math.random().toString(36).substr(2, 9),
    vendor: 'Test Vendor',
    amount: 50,
    category: 'supplies',
    date: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

function createTestNote(overrides = {}) {
  return {
    id: 'note_' + Math.random().toString(36).substr(2, 9),
    title: 'Test Note',
    body: 'Test note body',
    type: 'general',
    pinned: false,
    archived: false,
    tags: [],
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestTask(overrides = {}) {
  return {
    id: 'task_' + Math.random().toString(36).substr(2, 9),
    title: 'Test Task',
    status: 'pending',
    done: false,
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestBooking(overrides = {}) {
  return {
    id: 'bk_' + Math.random().toString(36).substr(2, 9),
    clientName: 'Test Client',
    serviceId: null,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'confirmed',
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestEvent(overrides = {}) {
  return {
    id: 'evt_' + Math.random().toString(36).substr(2, 9),
    title: 'Test Event',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestService(overrides = {}) {
  return {
    id: 'svc_' + Math.random().toString(36).substr(2, 9),
    name: 'Test Service',
    rate: 100,
    rateType: 'hour',
    duration: 60,
    created: new Date().toISOString(),
    ...overrides,
  };
}

function createTestContact(overrides = {}) {
  return {
    id: 'ct_' + Math.random().toString(36).substr(2, 9),
    name: 'Test Contact',
    phone: '555-0199',
    email: 'test@contact.com',
    created: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Fire a crossroads deposit via the test API
 */
async function fireDeposit(page, sourceType, destType, sourceData) {
  return await page.evaluate(({ src, dest, data }) => {
    const api = window.__crossroadsTest;
    if (api && typeof api.depositCard === 'function') {
      api.depositCard(src, dest, {
        sourceType: src,
        sourceData: data,
        name: data.biz || data.title || data.name || data.vendor || data.number || 'Test',
        id: data.id
      });
      return true;
    }
    return false;
  }, { src: sourceType, dest: destType, data: sourceData });
}

/**
 * Fire a sub-destination deposit via the test API
 */
async function fireSubDeposit(page, combo, subKey, sourceData) {
  return await page.evaluate(({ c, sk, data }) => {
    const api = window.__crossroadsTest;
    if (api && typeof api.executeDeposit === 'function') {
      api.executeDeposit(c, sk, {
        sourceType: c.split('-')[0],
        sourceData: data,
        name: data.biz || data.title || data.name || data.vendor || data.number || 'Test',
        id: data.id
      });
      return true;
    }
    return false;
  }, { c: combo, sk: subKey, data: sourceData });
}

module.exports = {
  clearHelixData,
  seedTestData,
  getHelixState,
  callHelixFunction,
  waitForHelixReady,
  openPanel,
  getStateCount,
  createTestProspect,
  createTestInvoice,
  createTestJob,
  createTestExpense,
  createTestNote,
  createTestTask,
  createTestBooking,
  createTestEvent,
  createTestService,
  createTestContact,
  fireDeposit,
  fireSubDeposit,
};

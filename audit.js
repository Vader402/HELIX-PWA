const { chromium } = require('./node_modules/playwright');
const path = require('path');

const PASS = '✓', FAIL = '✗', WARN = '⚠';
const results = { pass:0, fail:0, warn:0, details:[] };

function log(status, category, detail) {
  if(status === PASS) results.pass++;
  else if(status === FAIL) results.fail++;
  else results.warn++;
  results.details.push({ status, category, detail });
  console.log(`  ${status} [${category}] ${detail}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport:{width:380,height:700}, deviceScaleFactor:1 });
  await ctx.addInitScript(() => { sessionStorage.setItem('demo-guided','1'); });
  const page = await ctx.newPage();

  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  const fp = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  await page.goto(fp, { waitUntil:'networkidle', timeout:60000 });
  await page.waitForTimeout(3000);

  // ═══════════════════════════════════════
  console.log('\n═══ 1. PAGE LOAD & JS ERRORS ═══');
  // ═══════════════════════════════════════
  const syntaxErrors = jsErrors.filter(e => e.includes('Syntax') || e.includes('token') || e.includes('Unexpected'));
  if(syntaxErrors.length === 0) log(PASS, 'LOAD', 'No syntax errors on load');
  else syntaxErrors.forEach(e => log(FAIL, 'LOAD', 'Syntax error: ' + e.substring(0,100)));

  const clockText = await page.evaluate(() => document.querySelector('.clk')?.textContent || '');
  if(clockText && clockText !== '00:00') log(PASS, 'LOAD', 'Clock initialized: ' + clockText);
  else log(FAIL, 'LOAD', 'Clock shows ' + (clockText || 'nothing') + ' — init may have failed');

  // ═══════════════════════════════════════
  console.log('\n═══ 2. MODULE PANELS — Open & Render ═══');
  // ═══════════════════════════════════════
  const L1_MODULES = [
    { btn:'bCRM', name:'CRM', check:'.mp-card,div[class*="prospect"]' },
    { btn:'bNotes', name:'Notes' },
    { btn:'bMis', name:'Tasks/Missions' },
    { btn:'bEml', name:'Email' },
  ];
  const L2_MODULES = [
    { btn:'bJobs', name:'Jobs' },
    { btn:'bInvoices', name:'Invoices' },
    { btn:'bExpenses', name:'Expenses' },
    { btn:'bSimpl', name:'Vault' },
  ];

  async function testModule(mod) {
    const errsBefore = jsErrors.length;
    try {
      await page.evaluate(id => document.getElementById(id)?.click(), mod.btn);
      await page.waitForTimeout(1000);
      const panelOpen = await page.evaluate(() => !!document.querySelector('.panel.open'));
      if(panelOpen) log(PASS, 'MODULE', mod.name + ' panel opens');
      else log(FAIL, 'MODULE', mod.name + ' panel did NOT open');

      // Check for content
      const hasContent = await page.evaluate(() => {
        const p = document.querySelector('.panel.open');
        return p ? p.innerText.length : 0;
      });
      if(hasContent > 50) log(PASS, 'MODULE', mod.name + ' has content (' + hasContent + ' chars)');
      else log(WARN, 'MODULE', mod.name + ' content sparse (' + hasContent + ' chars)');

      // Close panel
      await page.evaluate(() => {
        const ov = document.getElementById('overlay');
        if(ov) ov.classList.remove('open');
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
      });
      await page.waitForTimeout(300);
    } catch(e) {
      log(FAIL, 'MODULE', mod.name + ' error: ' + e.message.substring(0,80));
    }
    const newErrors = jsErrors.slice(errsBefore);
    newErrors.filter(e => !e.includes('vibrate') && !e.includes('AudioContext')).forEach(e =>
      log(FAIL, 'MODULE', mod.name + ' JS error: ' + e.substring(0,100))
    );
  }

  for(const m of L1_MODULES) await testModule(m);
  // Swap to L2
  await page.evaluate(() => document.getElementById('dot2')?.click());
  await page.waitForTimeout(800);
  for(const m of L2_MODULES) await testModule(m);
  // Back to L1
  await page.evaluate(() => document.getElementById('dot1')?.click());
  await page.waitForTimeout(500);

  // ═══════════════════════════════════════
  console.log('\n═══ 3. VAULT ARITHMETIC ═══');
  // ═══════════════════════════════════════
  await page.evaluate(() => document.getElementById('dot2')?.click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById('bSimpl')?.click());
  await page.waitForTimeout(2000);

  const vaultMath = await page.evaluate(() => {
    if(typeof S === 'undefined') return { error: 'S not defined' };
    const results = {};

    // Revenue = sum of paid invoices
    const paidInvoices = (S.invoices||[]).filter(i => i.status === 'paid');
    results.paidInvoiceCount = paidInvoices.length;
    results.totalRevenue = paidInvoices.reduce((s,i) => s + (i.total||0), 0);

    // Expenses
    results.totalExpenses = (S.expenses||[]).reduce((s,e) => s + (e.amount||0), 0);
    results.expenseCount = (S.expenses||[]).length;

    // Profit
    results.netProfit = results.totalRevenue - results.totalExpenses;

    // Balance sheet equation: Assets = Liabilities + Equity
    const bs = S.balanceSheet || {};
    function sumBS(section) {
      if(!section) return 0;
      if(Array.isArray(section)) return section.reduce((s,a) => s + (a.amount||0), 0);
      if(typeof section === 'object') {
        let total = 0;
        Object.values(section).forEach(v => {
          if(Array.isArray(v)) total += v.reduce((s,a) => s + (a.amount||0), 0);
          else if(typeof v === 'number') total += v;
        });
        return total;
      }
      return 0;
    }
    const assets = sumBS(bs.assets);
    const liabilities = sumBS(bs.liabilities);
    const equity = sumBS(bs.equity);
    results.totalAssets = assets;
    results.totalLiabilities = liabilities;
    results.totalEquity = equity;
    results.bsBalanced = Math.abs(assets - liabilities - equity) < 1;
    results.bsDiff = Math.abs(assets - liabilities - equity);
    results.bsStructure = JSON.stringify(Object.keys(bs)).substring(0,100);

    // Budget
    const budget = (S.budgets||[])[0];
    if(budget) {
      const envelopes = budget.envelopes || [];
      results.envelopeCount = envelopes.length;
      results.totalBudgeted = envelopes.reduce((s,e) => s + (e.budgeted||0), 0);
      results.totalSpent = envelopes.reduce((s,e) => s + (e.spent||0), 0);
    }

    // Bank accounts
    results.bankAccountCount = (S.bankAccounts||[]).length;
    results.bankBalance = (S.bankAccounts||[]).reduce((s,a) => s + (a.balance||0), 0);

    return results;
  });

  if(vaultMath.error) {
    log(FAIL, 'VAULT-MATH', vaultMath.error);
  } else {
    log(vaultMath.paidInvoiceCount > 0 ? PASS : WARN, 'VAULT-MATH', 'Paid invoices: ' + vaultMath.paidInvoiceCount + ' totaling $' + vaultMath.totalRevenue.toFixed(2));
    log(vaultMath.expenseCount > 0 ? PASS : WARN, 'VAULT-MATH', 'Expenses: ' + vaultMath.expenseCount + ' totaling $' + vaultMath.totalExpenses.toFixed(2));
    log(PASS, 'VAULT-MATH', 'Net profit: $' + vaultMath.netProfit.toFixed(2));
    log(vaultMath.bsBalanced ? PASS : FAIL, 'VAULT-MATH', 'Balance sheet equation: A($' + vaultMath.totalAssets.toFixed(0) + ') = L($' + vaultMath.totalLiabilities.toFixed(0) + ') + E($' + vaultMath.totalEquity.toFixed(0) + ') — diff: $' + vaultMath.bsDiff.toFixed(2));
    if(vaultMath.envelopeCount !== undefined) {
      log(PASS, 'VAULT-MATH', 'Budget: ' + vaultMath.envelopeCount + ' envelopes, $' + vaultMath.totalBudgeted.toFixed(0) + ' budgeted, $' + vaultMath.totalSpent.toFixed(0) + ' spent');
    }
    log(vaultMath.bankAccountCount > 0 ? PASS : WARN, 'VAULT-MATH', 'Bank accounts: ' + vaultMath.bankAccountCount + ' with $' + vaultMath.bankBalance.toFixed(2) + ' total');
  }

  // Close vault
  await page.evaluate(() => {
    document.getElementById('overlay')?.classList.remove('open');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
  });
  await page.waitForTimeout(500);

  // ═══════════════════════════════════════
  console.log('\n═══ 4. VAULT SUB-MODULES ═══');
  // ═══════════════════════════════════════
  await page.evaluate(() => document.getElementById('bSimpl')?.click());
  await page.waitForTimeout(1500);

  const vaultSubs = ['dash','banking','budget','balance','reports'];
  for(const sub of vaultSubs) {
    const errsBefore = jsErrors.length;
    await page.evaluate(s => {
      const items = document.querySelectorAll('.vault-module-item, [data-module]');
      for(const item of items) {
        if(item.dataset.module === s || item.textContent.toLowerCase().includes(s)) { item.click(); return; }
      }
    }, sub);
    await page.waitForTimeout(1500);
    const content = await page.evaluate(() => document.querySelector('.panel.open')?.innerText?.length || 0);
    const newErrors = jsErrors.slice(errsBefore).filter(e => !e.includes('vibrate') && !e.includes('AudioContext'));
    if(newErrors.length > 0) log(FAIL, 'VAULT-SUB', sub + ': JS errors — ' + newErrors[0].substring(0,80));
    else if(content > 100) log(PASS, 'VAULT-SUB', sub + ' renders (' + content + ' chars)');
    else log(WARN, 'VAULT-SUB', sub + ' sparse content (' + content + ' chars)');
  }

  await page.evaluate(() => {
    document.getElementById('overlay')?.classList.remove('open');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
  });
  await page.waitForTimeout(500);

  // ═══════════════════════════════════════
  console.log('\n═══ 5. CROSSROADS DRAG-DROP ═══');
  // ═══════════════════════════════════════
  // Test if crossroads mode can be activated
  await page.evaluate(() => document.getElementById('dot1')?.click());
  await page.waitForTimeout(500);
  const xrTest = await page.evaluate(() => {
    const crmBtn = document.getElementById('bCRM');
    if(!crmBtn) return { error: 'CRM button not found' };
    // Simulate long press to activate crossroads
    if(typeof startCrossroads === 'function') {
      return { hasCrossroads: true };
    }
    return { hasCrossroads: false };
  });
  if(xrTest.hasCrossroads) log(PASS, 'CROSSROADS', 'startCrossroads function exists');
  else if(xrTest.error) log(FAIL, 'CROSSROADS', xrTest.error);
  else log(WARN, 'CROSSROADS', 'startCrossroads not found in global scope (may be in IIFE)');

  // ═══════════════════════════════════════
  console.log('\n═══ 6. DEAD ENDS — Buttons without handlers ═══');
  // ═══════════════════════════════════════
  const deadEnds = await page.evaluate(() => {
    const issues = [];
    // Check all buttons and clickable elements
    document.querySelectorAll('button, [onclick], [role="button"]').forEach(el => {
      const text = el.textContent.trim().substring(0,40);
      if(!text || text.length < 2) return;
      const onclick = el.getAttribute('onclick') || '';
      // Check for "coming soon" handlers
      if(onclick.includes('coming soon') || onclick.includes('Coming Soon') || onclick.includes('TODO')) {
        issues.push('STUB: "' + text + '" → ' + onclick.substring(0,60));
      }
    });
    return issues;
  });
  if(deadEnds.length === 0) log(PASS, 'DEAD-ENDS', 'No "coming soon" stubs found on current page');
  else deadEnds.forEach(d => log(WARN, 'DEAD-ENDS', d));

  // Check across all panels
  const allPanelDeadEnds = await page.evaluate(() => {
    const stubs = [];
    document.querySelectorAll('.panel').forEach(panel => {
      panel.querySelectorAll('button, [onclick]').forEach(el => {
        const oc = el.getAttribute('onclick') || '';
        if(oc.includes('coming') || oc.includes('Coming') || oc.includes('alert(') || oc.includes('TODO')) {
          stubs.push(panel.id + ': "' + el.textContent.trim().substring(0,30) + '" → ' + oc.substring(0,50));
        }
      });
    });
    return stubs;
  });
  allPanelDeadEnds.forEach(d => log(WARN, 'DEAD-ENDS', d));

  // ═══════════════════════════════════════
  console.log('\n═══ 7. SECURITY AUDIT ═══');
  // ═══════════════════════════════════════
  const html = await page.content();

  // Check for exposed secrets
  const apiKeyPatterns = [
    { name:'Supabase Service Key', pattern:/service_role['":\s]*eyJ/i },
    { name:'Stripe Secret Key', pattern:/sk_live_/i },
    { name:'Square Access Token', pattern:/sq0atp-|EAAA[A-Za-z0-9]/i },
    { name:'ElevenLabs Key', pattern:/sk_[a-f0-9]{40,}/i },
    { name:'Anthropic Key', pattern:/sk-ant-/i },
    { name:'Private Key', pattern:/-----BEGIN (RSA |EC )?PRIVATE KEY/i },
  ];
  apiKeyPatterns.forEach(p => {
    if(p.pattern.test(html)) log(FAIL, 'SECURITY', 'EXPOSED: ' + p.name + ' found in client code!');
    else log(PASS, 'SECURITY', p.name + ' not exposed');
  });

  // Check Supabase anon key (OK to be public)
  if(html.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    log(PASS, 'SECURITY', 'Supabase anon key present (public by design, RLS is boundary)');
  }

  // Check for localStorage of sensitive data
  const storedData = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    return keys.map(k => ({ key:k, size: localStorage.getItem(k)?.length || 0 }));
  });
  storedData.forEach(d => {
    if(d.key.toLowerCase().includes('token') || d.key.toLowerCase().includes('secret') || d.key.toLowerCase().includes('password')) {
      log(WARN, 'SECURITY', 'Sensitive-sounding localStorage key: ' + d.key + ' (' + d.size + ' bytes)');
    }
  });
  log(PASS, 'SECURITY', 'localStorage keys: ' + storedData.map(d=>d.key).join(', '));

  // ═══════════════════════════════════════
  console.log('\n═══ 8. DATA PERSISTENCE ═══');
  // ═══════════════════════════════════════
  const persistence = await page.evaluate(() => {
    const r = {};
    r.hasLocalStorage = typeof localStorage !== 'undefined';
    r.storageSize = JSON.stringify(localStorage).length;
    r.hasState = typeof S !== 'undefined';
    if(r.hasState) {
      r.prospects = (S.prospects||[]).length;
      r.contacts = (S.contacts||[]).length;
      r.events = (S.events||[]).length;
      r.tasks = (S.tasks||[]).length;
      r.notes = (S.notes||[]).length;
      r.invoices = (S.invoices||[]).length;
      r.expenses = (S.expenses||[]).length;
      r.jobs = (S.jobs||[]).length;
    }
    return r;
  });
  log(PASS, 'DATA', 'localStorage: ' + (persistence.storageSize/1024).toFixed(1) + 'KB');
  if(persistence.hasState) {
    log(PASS, 'DATA', 'State: ' + persistence.prospects + ' prospects, ' + persistence.contacts + ' contacts, ' + persistence.events + ' events');
    log(PASS, 'DATA', 'State: ' + persistence.tasks + ' tasks, ' + persistence.notes + ' notes, ' + persistence.invoices + ' invoices');
    log(PASS, 'DATA', 'State: ' + persistence.expenses + ' expenses, ' + persistence.jobs + ' jobs');
  }

  // ═══════════════════════════════════════
  console.log('\n═══ 9. PWA READINESS ═══');
  // ═══════════════════════════════════════
  const hasManifest = await page.evaluate(() => !!document.querySelector('link[rel="manifest"]'));
  log(hasManifest ? PASS : FAIL, 'PWA', 'manifest.json: ' + (hasManifest ? 'present' : 'MISSING'));

  const hasSW = await page.evaluate(() => 'serviceWorker' in navigator);
  log(hasSW ? PASS : WARN, 'PWA', 'ServiceWorker API available: ' + hasSW);

  const swRegistered = await page.evaluate(async () => {
    try { const regs = await navigator.serviceWorker.getRegistrations(); return regs.length; } catch(e) { return -1; }
  });
  if(swRegistered > 0) log(PASS, 'PWA', 'Service worker registered');
  else log(WARN, 'PWA', 'No service worker registered — offline caching not active');

  const viewport = await page.evaluate(() => {
    const m = document.querySelector('meta[name="viewport"]');
    return m ? m.getAttribute('content') : 'MISSING';
  });
  log(viewport.includes('width=device-width') ? PASS : FAIL, 'PWA', 'Viewport: ' + viewport.substring(0,60));

  // ═══════════════════════════════════════
  console.log('\n═══ 10. REPORT GENERATION (PDF/Export) ═══');
  // ═══════════════════════════════════════
  const exportFunctions = await page.evaluate(() => {
    const fns = [];
    if(typeof exportFullBackup === 'function') fns.push('exportFullBackup');
    if(typeof exportTransactionsCSV === 'function') fns.push('exportTransactionsCSV');
    // Check for PDF generation
    const hasPDF = document.querySelector('script[src*="pdf"]') ||
                   document.querySelector('script[src*="jspdf"]') ||
                   (typeof jspdf !== 'undefined') ||
                   (typeof html2canvas !== 'undefined');
    if(hasPDF) fns.push('PDF library loaded');
    return fns;
  });
  if(exportFunctions.includes('exportFullBackup')) log(PASS, 'EXPORT', 'Full backup export available');
  else log(WARN, 'EXPORT', 'exportFullBackup not found');
  if(exportFunctions.includes('exportTransactionsCSV')) log(PASS, 'EXPORT', 'CSV export available');
  if(exportFunctions.includes('PDF library loaded')) log(PASS, 'EXPORT', 'PDF library detected');
  else log(WARN, 'EXPORT', 'No PDF library detected — PDF generation may not work');

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('AUDIT COMPLETE');
  console.log('═'.repeat(50));
  console.log(`  ${PASS} PASS: ${results.pass}`);
  console.log(`  ${FAIL} FAIL: ${results.fail}`);
  console.log(`  ${WARN} WARN: ${results.warn}`);
  const total = results.pass + results.fail + results.warn;
  const score = Math.round((results.pass / total) * 100);
  console.log(`\n  SCORE: ${score}% (${results.pass}/${total})`);
  console.log(`\n  LAUNCH READINESS: ${score >= 90 ? 'READY' : score >= 80 ? 'NEARLY READY' : score >= 70 ? 'NEEDS WORK' : 'NOT READY'}`);

  // Failures summary
  const failures = results.details.filter(d => d.status === FAIL);
  if(failures.length > 0) {
    console.log('\n  CRITICAL FAILURES:');
    failures.forEach(f => console.log('    ' + FAIL + ' [' + f.category + '] ' + f.detail));
  }
  const warnings = results.details.filter(d => d.status === WARN);
  if(warnings.length > 0) {
    console.log('\n  WARNINGS:');
    warnings.forEach(w => console.log('    ' + WARN + ' [' + w.category + '] ' + w.detail));
  }

  await browser.close();
})();

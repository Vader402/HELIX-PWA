const {chromium} = require('./node_modules/playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch({headless: true});
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('PAGE: ' + e.message));
  p.on('console', m => {
    if(m.type() === 'error') {
      const loc = m.location();
      errors.push('CONSOLE: ' + m.text() + (loc ? ' @ line ' + loc.lineNumber : ''));
    }
  });
  const fp = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  await p.goto(fp, {timeout: 30000}).catch(e => errors.push('LOAD: ' + e.message));
  await p.waitForTimeout(5000);
  console.log(errors.length + ' errors found:');
  errors.forEach(e => console.log(' ', e.substring(0, 300)));
  await b.close();
})();

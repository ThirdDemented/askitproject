'use strict';
// CI uses the project's pinned Playwright. Local verification may supply an
// installed Playwright module and Chromium binary without changing dependencies.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../app/src/main/assets/www');
const out = path.resolve(__dirname, 'results/story-foundation');
const mime = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp'};
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/story-lab.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(400); res.end(); }
});
(async () => {
  fs.mkdirSync(out, {recursive: true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {})});
  const page = await browser.newPage({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
  const errors = [], checks = [];
  page.on('pageerror', e => errors.push(e.message));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('lwh-story-lab-v1')));
  const click = id => page.locator('[data-choice="' + id + '"]').click();
  try {
    await page.goto(url); await page.locator('#diner').waitFor();
    await page.evaluate(() => localStorage.setItem('lwh-rc1-save', 'original-journey-sentinel'));
    await page.click('#diner'); await click('enter'); await click('counter'); await click('soup');
    assert.equal((await state()).trip.cashCents, 15000);
    assert.equal((await state()).trip.active.data.billCents, 1200); checks.push('bill reserved, not prematurely spent');
    await click('placemat'); const beforeReload = await state();
    await page.reload(); assert.deepEqual(await state(), beforeReload); checks.push('mid-scene reload is identical');
    await page.locator('#art').evaluate(img => img.decode());
    await page.screenshot({path: path.join(out, 'diner-portrait.png'), fullPage: true});
    await click('eat'); await click('pay'); await click('exit');
    assert.equal((await state()).trip.cashCents, 13800); checks.push('meal and payment resolve exactly once');
    await page.uncheck('#toolkit'); await page.fill('#cash', '0'); await page.click('#new');
    await page.click('#repair'); await click('inspect');
    assert.equal(await page.locator('[data-choice="tools"]').count(), 0); checks.push('toolkit option absent without toolkit');
    for (const [width, height] of [[360,800], [412,915], [844,390], [1280,720]]) {
      await page.setViewportSize({width, height});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow at ' + width);
      checks.push('layout fits ' + width + 'x' + height);
    }
    await page.locator('#art').evaluate(img => img.decode());
    await page.screenshot({path: path.join(out, 'repair-landscape.png'), fullPage: true});
    await click('walk'); await click('clerk_help'); await click('exit');
    assert.equal((await state()).trip.cashCents, 0); assert.deepEqual((await state()).trip.vehicle.faults, []);
    checks.push('zero-budget repair has a way out');
    await page.uncheck('#memory'); await page.click('#diner'); await click('leave'); await click('exit');
    assert.deepEqual((await state()).player.actions, {}); checks.push('memory opt-out honored');
    const unchanged = await state();
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'lwh-story-lab-v1') throw new DOMException('Test storage is full', 'QuotaExceededError');
        return window.originalSetItem.call(this, key, value);
      };
    });
    await page.click('#repair'); assert.deepEqual(await state(), unchanged);
    assert.equal(await page.locator('#error').isVisible(), true); checks.push('failed persistence does not apply the action');
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; localStorage.setItem('lwh-story-lab-v1', '{broken'); });
    await page.reload(); assert.equal(await page.locator('#error').isVisible(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('lwh-story-lab-v1')), '{broken');
    assert.equal(await page.locator('#repair').isDisabled(), true); checks.push('corrupt save retained, not silently overwritten');
    await page.click('#new'); assert.equal((await state()).schemaVersion, 1); checks.push('explicit new test trip recovers lab');
    assert.equal(await page.evaluate(() => localStorage.getItem('lwh-rc1-save')), 'original-journey-sentinel');
    checks.push('original journey save untouched');
    assert.deepEqual(errors, []); checks.push('no uncaught JavaScript errors');
    const result = {suite: 'story-foundation-browser', passed: checks.length, checks, errors};
    fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

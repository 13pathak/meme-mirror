import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('actual GPU initialization failure falls back to CPU', async ({ page }) => {
  const source = await readFile(new URL('../../public/vision-worker.js', import.meta.url), 'utf8');
  await page.route('**/vision-worker.js', route => route.fulfill({ contentType: 'text/javascript', body: `
    const getContextOriginal = OffscreenCanvas.prototype.getContext;
    OffscreenCanvas.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : getContextOriginal.call(this, type, ...args);
    };
    ${source}` }));
  await page.goto('/');
  const result = await page.evaluate(() => new Promise((resolve,reject) => {
    const worker = new Worker('/vision-worker.js');
    const timer = setTimeout(() => { worker.terminate(); reject(new Error('Timeout')); }, 45000);
    worker.onmessage = e => { clearTimeout(timer); worker.terminate(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); };
    worker.postMessage({ id: 1, type: 'init', delegate: 'GPU' });
  }));
  expect(result.delegate).toBe('CPU');
});
test('model load failure gives recovery instructions; laptop and mobile controls fit', async ({ page }) => {
  await page.route('**/vision-worker.js', route => route.fulfill({ contentType: 'text/javascript', body: `onmessage=e=>postMessage({id:e.data.id,error:'Missing model (simulated)'})` }));
  await page.setViewportSize({ width: 1366, height: 768 }); await page.goto('/');
  const consoleBox = await page.locator('.game-console').boundingBox(); expect(consoleBox.y + consoleBox.height).toBeLessThanOrEqual(768);
  await page.screenshot({ path: 'test-results/laptop.png', fullPage: true });
  await page.locator('#enable-camera').click(); await expect(page.locator('#tracking-message')).toContainText('Local model could not load'); await expect(page.locator('#start')).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  const button = await page.locator('#enable-camera').boundingBox(); const message = await page.locator('#tracking-message').boundingBox(); expect(button.y + button.height).toBeLessThan(message.y);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

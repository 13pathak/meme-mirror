import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Fresh browser contexts, no cache, and all non-loopback requests denied.
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort('internetdisconnected');
  });
});

test('visitor layout, mobile fit, settings and actual local CPU/GPU model', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Can you make that face?' })).toBeVisible();
  await expect(page.locator('#start')).toBeDisabled();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Open operator settings' }).click();
  await expect(page.locator('#operator')).toBeVisible(); await page.locator('#operator-close').click();
  const models = await page.evaluate(async () => {
    const results = [];
    for (const preference of ['CPU', 'GPU']) {
      const worker = new Worker('/vision-worker.js');
      const request = (data, transfers = []) => new Promise((resolve,reject) => { const timer = setTimeout(() => reject(new Error('Worker timeout')), 45000); worker.onmessage = e => { clearTimeout(timer); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data); }; worker.onerror = e => reject(new Error(e.message)); worker.postMessage(data, transfers); });
      const init = await request({ id: 1, type: 'init', delegate: preference });
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
      canvas.getContext('2d').fillRect(0, 0, 640, 480);
      let bitmap = await createImageBitmap(canvas);
      const frame = await request({ id: 2, type: 'frame', bitmap, time: performance.now() }, [bitmap]);
      bitmap = await createImageBitmap(canvas);
      const reference = await request({ id: 3, type: 'reference', bitmap }, [bitmap]);
      results.push({ requested: preference, delegate: init.delegate, blankFrameFaces: frame.count, blankImageFaces: reference.count, ms: frame.ms });
      worker.terminate();
    }
    return results;
  });
  console.log('Real local runtime smoke check:', JSON.stringify(models));
  expect(models.every(r => r.blankFrameFaces === 0 && r.blankImageFaces === 0)).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); expect(errors).toEqual([]);
});

import { cameraStub as mockCamera } from './camera-stub.js';
test('simulated camera: six rounds, handover, retry, tracking loss, comparison, reset', async ({ page }) => {
  await page.route('**/camera.js', route => route.fulfill({ contentType: 'text/javascript', body: mockCamera }));
  await page.clock.install(); await page.goto('/'); await page.locator('#enable-camera').click(); await page.locator('#start').click();
  await page.clock.runFor(3200);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('test-face-count', { detail: 2 })));
  await page.clock.runFor(500); await expect(page.locator('#live-score')).toHaveText('—'); await expect(page.locator('#tracking-message')).toContainText('One face at a time');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('test-face-count', { detail: 1 })));
  await page.clock.runFor(12000); await expect(page.locator('#phase-label')).toHaveText('ROUND COMPLETE');
  await page.locator('#retry').click(); await expect(page.locator('#countdown')).toBeVisible(); await page.clock.runFor(13000);
  for (let round = 0; round < 6; round++) {
    await expect(page.locator('#phase-label')).toHaveText('ROUND COMPLETE'); await page.locator('#next').click();
    if (round === 2) { await expect(page.locator('#prompt')).toHaveText('Your turn, parent!'); await page.locator('#next').click(); }
    if (round < 5) await page.clock.runFor(13000);
  }
  await expect(page.locator('#summary')).toBeVisible(); await expect(page.locator('#comparison')).toContainText('tie');
  await page.screenshot({ path: 'test-results/family-result.png', fullPage: true });
  await page.locator('#new-family').click(); await expect(page.locator('#summary')).toBeHidden(); await expect(page.locator('#live-score')).toHaveText('—'); await expect(page.locator('#turn-label')).toHaveText('CHILD’S TURN');
});

test('real camera permission denial produces actionable message', async ({ page }) => {
  await page.route('**/vision-worker.js', r => r.fulfill({ contentType: 'text/javascript', body: `onmessage=e=>postMessage({id:e.data.id,delegate:'TEST'})` }));
  await page.goto('/'); await page.locator('#enable-camera').click(); await expect(page.locator('#tracking-message')).toContainText('Camera permission is off', { timeout: 20000 });
  await expect(page.locator('#start')).toBeDisabled();
});

test('actual model validates one human reference, rejects two faces and blank photo; survives reload', async ({ page }) => {
  const portrait = await readFile(new URL('../portrait.jpg', import.meta.url));
  await page.goto('/');
  const counts = await page.evaluate(async base64 => {
    const img = new Image(); img.src = 'data:image/jpeg;base64,' + base64; await img.decode();
    const image = await createImageBitmap(img);
    const worker = new Worker('/vision-worker.js');
    const send = (data, transfer = []) => new Promise((resolve,reject) => { const timer=setTimeout(()=>reject(new Error('Timed out')),45000);worker.onmessage=e=>{clearTimeout(timer);e.data.error?reject(new Error(e.data.error)):resolve(e.data);};worker.postMessage(data,transfer); });
    await send({ id: 1, type: 'init', delegate: 'CPU' });
    const single = await createImageBitmap(image);
    const one = await send({ id: 2, type: 'reference', bitmap: single }, [single]);
    const canvas = document.createElement('canvas'); canvas.width = image.width * 2; canvas.height = image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);ctx.drawImage(image,image.width,0);
    const double = await createImageBitmap(canvas);
    const two = await send({ id: 3, type: 'reference', bitmap: double }, [double]);
    const videoFrame = await createImageBitmap(image);
    const videoResult = await send({ id: 4, type: 'frame', bitmap: videoFrame, time: performance.now(), returnFrame: true }, [videoFrame]);
    const returnedFrameSize = [videoResult.bitmap?.width, videoResult.bitmap?.height];
    const originalFrameSize = [image.width, image.height];
    videoResult.bitmap?.close();
    worker.terminate();image.close();return { one: one.count, two: two.count, blendshapes: one.categories?.length, returnedFrameSize, originalFrameSize };
  }, portrait.toString('base64'));
  console.log('Actual reference counts:', counts); expect(counts).toMatchObject({ one: 1, two: 2, blendshapes: 52 });
  expect(counts.returnedFrameSize).toEqual(counts.originalFrameSize);
  await page.locator('#operator-open').click();
  await page.locator('#delegate').selectOption('CPU');
  await page.locator('#reference-file').setInputFiles({ name: 'portrait.jpg', mimeType: 'image/jpeg', buffer: portrait });
  await page.locator('#save-reference').click(); await expect(page.locator('#reference-status')).toContainText('Saved!', { timeout: 45000 });
  await page.locator('#operator-close').click(); await expect(page.locator('#reference-kind')).toHaveText('ANALYSED HUMAN PHOTO');
  await page.reload(); await expect(page.locator('#reference-kind')).toHaveText('ANALYSED HUMAN PHOTO');
  await page.locator('#operator-open').click(); await page.locator('#restore-demo').click(); await page.locator('#operator-close').click();
  await expect(page.locator('#reference-kind')).toHaveText('ILLUSTRATED DEMO');
});


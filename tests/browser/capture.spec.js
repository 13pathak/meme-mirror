import { test, expect } from '@playwright/test';
test.use({ launchOptions: { ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });
test('real CPU capture pipeline consumes synthetic camera frames and rejects no-face attempts', async ({ page, context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort('internetdisconnected'));
  await page.goto('/'); await page.locator('#operator-open').click(); await page.locator('#delegate').selectOption('CPU'); await page.locator('#reconnect').click();
  await expect(page.locator('#diagnostics')).toContainText('Delegate: CPU | Faces: 0', { timeout: 45000 });
  await expect(page.locator('#diagnostics')).toContainText('Actual camera: 640 × 480');
  await page.locator('#operator-close').click(); await expect(page.locator('#start')).toBeEnabled(); await page.locator('#start').click();
  await expect(page.locator('#phase-label')).toHaveText('COPY THE FACE', { timeout: 7000 }); await expect(page.locator('#live-score')).toHaveText('—');
  await expect(page.locator('#tracking-message')).toHaveText('Step into view and face the camera.');
  await page.locator('#reset').click(); await page.locator('#operator-open').click(); await page.locator('#stop-camera').click(); await expect(page.locator('#operator-status')).toContainText('Camera is off');
});

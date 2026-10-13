import { test, expect } from '@playwright/test';

// Scoring is simulated; an asymmetric canvas makes exact capture/mirroring observable.
import { cameraStub as cameraStub } from './camera-stub.js';
test.beforeEach(async ({ page, context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort('internetdisconnected'));
  await page.route('**/camera.js', route => route.fulfill({ contentType:'text/javascript',body:cameraStub }));
  const frozenTime = new Date();
  await page.clock.install({ time: frozenTime });
  await page.goto('/');
  await page.clock.pauseAt(new Date(frozenTime.getTime() + 1000));
  await page.locator('#operator-open').click();
  await page.locator('#reference-set').selectOption('demo');
  await page.locator('#operator-close').click();
  await page.locator('#enable-camera').click();await page.locator('#start').click();
});
const pixels = page => page.locator('#reveal-photo').evaluate(canvas => ({width:canvas.width,height:canvas.height,left:[...canvas.getContext('2d').getImageData(0,0,1,1).data],right:[...canvas.getContext('2d').getImageData(canvas.width-1,0,1,1).data]}));
async function reachReveal(page) {
  await page.clock.runFor(7600);
  for(let i=0;i<15 && !(await page.locator('#round-reveal').evaluate(dialog=>dialog.open));i++)await page.clock.runFor(100);
  await expect(page.locator('#round-reveal')).toBeVisible();
}

test('completed hold reveals mirrored frame and final score for 2.5 seconds, then unlocks next meme', async ({ page }) => {
  await reachReveal(page);
  await expect(page.locator('#round-reveal')).toBeVisible();
  await expect(page.locator('#reveal-score')).toHaveText('100%');
  await expect(page.locator('#next')).toBeDisabled();
  await expect(page.locator('#retry')).toBeDisabled();
  const original=await pixels(page);
  expect(original).toEqual({width:640,height:480,left:[229,115,134,255],right:[107,164,210,255]});
  await page.screenshot({path:'test-results/steady-face-reveal.png',fullPage:true});
  for (const viewport of [{width:390,height:844},{width:1366,height:768}]) {
    await page.setViewportSize(viewport);
    const box = await page.locator('#round-reveal').boundingBox();
    expect(box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  await page.screenshot({path:'test-results/steady-face-reveal-laptop.png',fullPage:true});
  await page.clock.runFor(2200);await expect(page.locator('#round-reveal')).toBeVisible();expect(await pixels(page)).toEqual(original);
  await page.clock.runFor(400);await expect(page.locator('#round-reveal')).toBeHidden();
  expect(await page.locator('#reveal-photo').evaluate(canvas=>[canvas.width,canvas.height])).toEqual([0,0]);
  await expect(page.locator('#next')).toBeEnabled();await page.locator('#next').click();await page.clock.runFor(100);
  await expect(page.locator('#caption')).toHaveText('“The test has a second page.”');
  await expect(page.locator('#countdown')).toBeVisible();
  expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual(['meme-mirror-default-set-v1']);
});

test('reset clears the picture immediately and failed tracking cannot reveal a face', async ({ page }) => {
  await reachReveal(page);
  await page.locator('#reveal-reset').click();await page.clock.runFor(100);
  await expect(page.locator('#round-reveal')).toBeHidden();
  expect(await page.locator('#reveal-photo').evaluate(canvas=>[canvas.width,canvas.height])).toEqual([0,0]);
  await expect(page.locator('#start')).toBeVisible();await page.locator('#start').click();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('test-face-count',{detail:2})));
  await page.clock.runFor(19000);await expect(page.locator('#phase-label')).toHaveText('LET’S TRY THAT AGAIN');
  await expect(page.locator('#round-reveal')).toBeHidden();await expect(page.locator('#live-score')).toHaveText('—');
});

test('retry and leaving the page clear the old picture', async ({ page }) => {
  await reachReveal(page);await page.clock.runFor(2600);await expect(page.locator('#round-reveal')).toBeHidden();
  await page.locator('#retry').click();await reachReveal(page);
  await expect(page.locator('#round-reveal')).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await expect(page.locator('#round-reveal')).toBeHidden();
  expect(await page.locator('#reveal-photo').evaluate(canvas=>[canvas.width,canvas.height])).toEqual([0,0]);
});

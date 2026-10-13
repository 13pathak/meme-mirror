import { test, expect } from '@playwright/test';
import { cameraStub } from './camera-stub.js';

test('a failed meme can be skipped, both players can continue, and skipped scores are explicit',async({page,context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort('internetdisconnected'));
  await page.route('**/camera.js',route=>route.fulfill({contentType:'text/javascript',body:cameraStub}));
  const start=new Date();await page.clock.install({time:start});await page.goto('/');await page.clock.pauseAt(new Date(start.getTime()+1000));
  await expect(page.locator('#skip')).toBeHidden();
  await page.locator('#enable-camera').click();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('test-sample',{detail:{}})));
  await page.locator('#start').click();await expect(page.locator('#skip')).toBeHidden();
  await page.clock.runFor(17500);
  await expect(page.locator('#phase-label')).toHaveText('LET’S TRY THAT AGAIN');
  await expect(page.locator('#retry')).toBeVisible();await expect(page.locator('#skip')).toHaveText('Skip meme (0 points) →');
  for(const viewport of [{width:1366,height:768},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    if(viewport.width<600)await page.locator('#skip').scrollIntoViewIfNeeded();
    await expect(page.locator('#skip')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`test-results/skip-controls-${viewport.width}.png`});
  }
  await page.setViewportSize({width:1366,height:768});
  await page.locator('#skip').click();
  await expect(page.locator('#caption')).toHaveText('“The test has a second page.”');
  await expect(page.locator('[data-round="0"] .round-score')).toHaveText('· skipped (0)');
  await expect(page.locator('#round-reveal')).toBeHidden();await expect(page.locator('#live-score')).toHaveText('—');
  // Cover hold, practice, and third-round transitions without needing any match.
  for(let round=1;round<6;round++) {
    await page.clock.runFor(round===1?7300:3200);
    await page.locator('#skip').click();await expect(page.locator('#round-reveal')).toBeHidden();
    if(round===2){await expect(page.locator('#phase-label')).toHaveText('PASS THE SPOTLIGHT');await expect(page.locator('#skip')).toBeHidden();await page.locator('#next').click();}
  }
  await expect(page.locator('#summary')).toBeVisible();await expect(page.locator('#skip')).toBeHidden();
  await expect(page.locator('#child-total')).toHaveText('0');await expect(page.locator('#parent-total')).toHaveText('0');
  expect((await page.locator('#round-summary').textContent()).match(/skipped \(0\)/g)).toHaveLength(6);
  await page.locator('#new-family').click();await expect(page.locator('#skip')).toBeHidden();
  await expect(page.locator('.round-score')).toHaveText(['','','']);
});

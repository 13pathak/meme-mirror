import {test,expect} from '@playwright/test';
import { cameraStub } from './camera-stub.js';

test.beforeEach(async({page,context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort('internetdisconnected'));
  await page.addInitScript(()=>localStorage.setItem('meme-mirror-round-memes-v1',JSON.stringify(['pout','smile','surprise'])));
  await page.route('**/camera.js',route=>route.fulfill({contentType:'text/javascript',body:cameraStub}));
  const start=new Date();await page.clock.install({time:start});await page.goto('/');await page.clock.pauseAt(new Date(start.getTime()+1000));
  await page.locator('#enable-camera').click();
});
const sample = (page,values) => page.evaluate(values=>window.dispatchEvent(new CustomEvent('test-sample',{detail:values})),values);

test('neutral and weak pout attempts never get a reveal; a moderate retry succeeds',async({page})=>{
  await sample(page,{pucker:.1,funnel:.03});
  await page.locator('#start').click();await page.clock.runFor(8500);
  await expect(page.locator('#round-reveal')).toBeHidden();
  await expect(page.locator('#phase-label')).toHaveText('FIND THE EXPRESSION');
  await expect(page.locator('#hold-progress')).toHaveText('0% held');
  await expect(page.locator('#subprompt')).toContainText('Push your lips forward');
  await sample(page,{});await page.clock.runFor(9000);
  await expect(page.locator('#phase-label')).toHaveText('LET’S TRY THAT AGAIN');
  await expect(page.locator('#next')).toBeHidden();
  await expect(page.locator('#round-reveal')).toBeHidden();
  await sample(page,{pucker:.49,funnel:.175});
  await page.locator('#retry').click();await page.clock.runFor(8300);
  await expect(page.locator('#round-reveal')).toBeVisible();
  const score=parseInt(await page.locator('#reveal-score').textContent());
  expect(score).toBeGreaterThanOrEqual(55);expect(score).toBeLessThan(80);
});

test('a wrong expression can be corrected during the same hold window',async({page})=>{
  await sample(page,{smile:.8});await page.locator('#start').click();await page.clock.runFor(8300);
  await expect(page.locator('#round-reveal')).toBeHidden();await expect(page.locator('#hold-progress')).toHaveText('0% held');
  await sample(page,{pucker:.55,funnel:.2});await page.clock.runFor(2100);
  await expect(page.locator('#round-reveal')).toBeVisible();
  await expect(page.locator('#round-reveal .eyebrow')).toContainText('100% HELD');
});

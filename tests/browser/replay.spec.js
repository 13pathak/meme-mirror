import { test, expect } from '@playwright/test';
import { cameraStub } from './camera-stub.js';

test.beforeEach(async({page,context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort('internetdisconnected'));
  await page.route('**/camera.js',route=>route.fulfill({contentType:'text/javascript',body:cameraStub}));
  const time=new Date();await page.clock.install({time});await page.goto('/');await page.clock.pauseAt(new Date(time.getTime()+1000));
});
const color=(page,value)=>page.evaluate(value=>window.dispatchEvent(new CustomEvent('test-frame-color',{detail:value})),value);
const pixel=page=>page.locator('#reveal-photo').evaluate(canvas=>[...canvas.getContext('2d').getImageData(0,0,1,1).data]);

test('replays recent movement in order, ends on the completed face, then clears',async({page})=>{
  await page.locator('#enable-camera').click();await page.locator('#start').click();
  await page.clock.runFor(5800);await color(page,'#00ff00');
  await page.clock.runFor(900);await color(page,'#0000ff');
  await page.clock.runFor(900);await color(page,'#ff0000');
  await page.clock.runFor(900);
  await expect(page.locator('#round-reveal')).toBeVisible();await expect(page.locator('#reveal-kind')).toHaveText('YOUR INSTANT REPLAY');
  await expect(page.locator('#reveal-score')).toHaveText('100%');
  expect(await pixel(page)).toEqual([0,255,0,255]);
  // New live frames must not overwrite the frozen replay sequence.
  await color(page,'#ffff00');await page.clock.runFor(900);expect(await pixel(page)).toEqual([0,0,255,255]);
  await page.clock.runFor(900);expect(await pixel(page)).toEqual([255,0,0,255]);
  await page.clock.runFor(500);await expect(page.locator('#round-reveal')).toBeHidden();
  expect(await page.locator('#reveal-photo').evaluate(c=>[c.width,c.height])).toEqual([0,0]);
  await expect(page.locator('#next')).toBeEnabled();
  // Retry creates an entirely new replay, with no previous participant frames.
  await page.locator('#retry').click();await page.clock.runFor(8300);
  expect(await pixel(page)).toEqual([255,255,0,255]);
  await page.locator('#reveal-reset').click();await page.clock.runFor(500);
  expect(await page.locator('#reveal-photo').evaluate(c=>[c.width,c.height])).toEqual([0,0]);
});

test('replay memory is bounded, mirrored, copied from source and wiped after ownership transfer',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {ReplayBuffer,MAX_REPLAY_FRAMES,REPLAY_MS,clearFrames}=await import('/replay.js');
    const buffer=new ReplayBuffer();const source=document.createElement('canvas');source.width=1280;source.height=960;
    const ctx=source.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,640,960);ctx.fillStyle='blue';ctx.fillRect(640,0,640,960);
    buffer.capture(source,0);const first=buffer.frames[0].canvas;
    ctx.fillStyle='green';ctx.fillRect(0,0,1280,960);
    const copy={size:[first.width,first.height],left:[...first.getContext('2d').getImageData(0,0,1,1).data]};
    for(let time=80;time<=4000;time+=80)buffer.capture(source,time);
    const bounded=buffer.frames.length<=MAX_REPLAY_FRAMES&&buffer.frames[0].time>=4000-REPLAY_MS;
    const frames=buffer.take(),canvases=frames.map(f=>f.canvas);buffer.clear();
    const transferred=buffer.frames.length===0&&canvases.every(c=>c.width>0);
    clearFrames(frames);
    return {copy,bounded,transferred,wiped:canvases.every(c=>c.width===0&&c.height===0)&&frames.length===0};
  });
  expect(result).toEqual({copy:{size:[640,480],left:[0,0,255,255]},bounded:true,transferred:true,wiped:true});
});

test('reduced motion keeps the finishing frame still and a missing replay leaves results usable',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#enable-camera').click();await page.locator('#start').click();
  await page.clock.runFor(7600);await color(page,'#ff0000');await page.clock.runFor(700);
  await expect(page.locator('#reveal-kind')).toHaveText('YOUR MATCH');expect(await pixel(page)).toEqual([255,0,0,255]);
  await color(page,'#00ff00');await page.clock.runFor(1000);expect(await pixel(page)).toEqual([255,0,0,255]);
  await page.locator('#reveal-reset').click();
  // Simulate a camera that supplies measurements but cannot return image frames.
  await page.route('**/camera.js',route=>route.fulfill({contentType:'text/javascript',body:cameraStub.replace('bitmap:this.frame','bitmap:null')}));
  await page.reload();await page.locator('#enable-camera').click();await page.locator('#start').click();await page.clock.runFor(8300);
  await expect(page.locator('#round-reveal')).toBeHidden();await expect(page.locator('#next')).toBeEnabled();
  await expect(page.locator('#phase-label')).toHaveText('ROUND COMPLETE');
});

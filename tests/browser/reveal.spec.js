import { test, expect } from '@playwright/test';

// Scoring is simulated; an asymmetric canvas makes exact capture/mirroring observable.
const cameraStub = `export class VisionCamera {
  constructor(video,onSample) {
    this.video=video;this.onSample=onSample;this.running=false;this.count=1;
    this.frame=document.createElement('canvas');this.frame.width=640;this.frame.height=480;
    const ctx=this.frame.getContext('2d');ctx.fillStyle='#6ba4d2';ctx.fillRect(0,0,320,480);ctx.fillStyle='#e57386';ctx.fillRect(320,0,320,480);
    ctx.fillStyle='#ffcf59';ctx.beginPath();ctx.arc(320,220,140,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#283022';ctx.beginPath();ctx.arc(275,200,15,0,Math.PI*2);ctx.arc(365,200,15,0,Math.PI*2);ctx.fill();
    ctx.lineWidth=9;ctx.beginPath();ctx.arc(320,245,60,0,Math.PI);ctx.stroke();
    ctx.font='20px Arial';ctx.fillText('SIMULATED CAMERA FRAME',185,425);
    this.timer=setInterval(()=>{if(this.running&&!this.paused)this.onSample({count:this.count,sample:this.count===1?{smile:.8,brow:.5,wide:.4,jaw:.55,pucker:.7,funnel:.25,frown:0,press:0}:null,bitmap:this.frame,ms:1,captured:performance.now(),received:performance.now()});},100);
    window.addEventListener('test-face-count',e=>this.count=e.detail);
  }
  async start(){this.running=true;this.stream={getVideoTracks:()=>[{getSettings:()=>({deviceId:'test'})}]};return [{deviceId:'test',label:'Simulated camera'}];}
  stop(){this.running=false;this.onSample({count:0,sample:null,captured:performance.now(),received:performance.now()});}
  dispose(){this.stop();}
}`;
test.beforeEach(async ({ page, context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort('internetdisconnected'));
  await page.route('**/camera.js', route => route.fulfill({ contentType:'text/javascript',body:cameraStub }));
  const frozenTime = new Date();
  await page.clock.install({ time: frozenTime });
  await page.goto('/');
  await page.clock.pauseAt(new Date(frozenTime.getTime() + 1000));
  await page.locator('#enable-camera').click();await page.locator('#start').click();
});
const pixels = page => page.locator('#reveal-photo').evaluate(canvas => ({width:canvas.width,height:canvas.height,left:[...canvas.getContext('2d').getImageData(0,0,1,1).data],right:[...canvas.getContext('2d').getImageData(canvas.width-1,0,1,1).data]}));

test('completed hold reveals mirrored frame and final score for 2.5 seconds, then unlocks next meme', async ({ page }) => {
  await page.clock.runFor(11900);
  await expect(page.locator('#round-reveal')).toBeVisible();
  await expect(page.locator('#reveal-score')).toHaveText('68%');
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
  await page.clock.runFor(300);await expect(page.locator('#round-reveal')).toBeHidden();
  expect(await page.locator('#reveal-photo').evaluate(canvas=>[canvas.width,canvas.height])).toEqual([0,0]);
  await expect(page.locator('#next')).toBeEnabled();await page.locator('#next').click();await page.clock.runFor(100);
  await expect(page.locator('#caption')).toHaveText('“The test has a second page.”');
  await expect(page.locator('#countdown')).toBeVisible();
  expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});

test('reset clears the picture immediately and failed tracking cannot reveal a face', async ({ page }) => {
  await page.clock.runFor(11900);await expect(page.locator('#round-reveal')).toBeVisible();
  await page.locator('#reveal-reset').click();await page.clock.runFor(100);
  await expect(page.locator('#round-reveal')).toBeHidden();
  expect(await page.locator('#reveal-photo').evaluate(canvas=>[canvas.width,canvas.height])).toEqual([0,0]);
  await expect(page.locator('#start')).toBeVisible();await page.locator('#start').click();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('test-face-count',{detail:2})));
  await page.clock.runFor(19000);await expect(page.locator('#phase-label')).toHaveText('LET’S TRY THAT AGAIN');
  await expect(page.locator('#round-reveal')).toBeHidden();await expect(page.locator('#live-score')).toHaveText('—');
});

test('retry and leaving the page clear the old picture', async ({ page }) => {
  await page.clock.runFor(14400);await expect(page.locator('#round-reveal')).toBeHidden();
  await page.locator('#retry').click();await page.clock.runFor(11900);
  await expect(page.locator('#round-reveal')).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await expect(page.locator('#round-reveal')).toBeHidden();
  expect(await page.locator('#reveal-photo').evaluate(canvas=>[canvas.width,canvas.height])).toEqual([0,0]);
});

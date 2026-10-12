import {test,expect} from '@playwright/test';

test('low, fluctuating samosa matches finish a short hold without progress resets',async({page,context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort('internetdisconnected'));
  await page.addInitScript(()=>localStorage.setItem('meme-mirror-round-memes-v1',JSON.stringify(['pout','smile','surprise'])));
  await page.route('**/camera.js',route=>route.fulfill({contentType:'text/javascript',body:`export class VisionCamera {
    constructor(video,onSample){this.video=video;this.onSample=onSample;this.running=false;
      this.frame=document.createElement('canvas');this.frame.width=640;this.frame.height=480;this.frame.getContext('2d').fillRect(0,0,640,480);
      this.timer=setInterval(()=>{if(this.running&&!this.paused)this.onSample({count:1,sample:{smile:0,brow:0,wide:0,jaw:0,pucker:Math.floor(performance.now()/200)%2?.45:.02,funnel:.05,frown:0,press:0},bitmap:this.frame,captured:performance.now(),received:performance.now(),ms:1});},100);
    }
    async start(){this.running=true;this.stream={getVideoTracks:()=>[{getSettings:()=>({deviceId:'test'})}]};return[];}
    stop(){this.running=false;this.onSample({count:0,sample:null,captured:performance.now(),received:performance.now()});}dispose(){this.stop();}
  }`}));
  const start=new Date();await page.clock.install({time:start});await page.goto('/');await page.clock.pauseAt(new Date(start.getTime()+1000));
  await expect(page.locator('#caption')).toHaveText('“The last samosa is gone.”');
  await page.locator('#enable-camera').click();const startedAt=await page.evaluate(()=>performance.now());await page.locator('#start').click();
  await page.clock.runFor(7200);let previous=0;let finished=false;
  for(let step=0;step<14;step++){
    const state=await page.evaluate(()=>({revealed:document.querySelector('#round-reveal').open,progress:document.querySelector('#hold-progress').textContent}));
    if(state.revealed){finished=true;break;}
    const progress=parseInt(state.progress)||0;expect(progress).toBeGreaterThanOrEqual(previous);previous=progress;
    await page.clock.runFor(100);
  }
  expect(finished).toBeTruthy();
  expect(await page.evaluate(()=>performance.now())-startedAt).toBeLessThanOrEqual(8500);
  const score=parseInt(await page.locator('#reveal-score').textContent());expect(score).toBeLessThan(50);
  await expect(page.locator('#round-reveal .eyebrow')).toContainText('100% HELD');
});

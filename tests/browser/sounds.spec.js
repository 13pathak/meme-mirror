import { test, expect } from '@playwright/test';
import { cameraStub } from './camera-stub.js';

test.beforeEach(async({page,context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort('internetdisconnected'));
  await page.route('**/camera.js',route=>route.fulfill({contentType:'text/javascript',body:cameraStub}));
  const time=new Date();await page.clock.install({time});await page.goto('/');await page.clock.pauseAt(new Date(time.getTime()+1000));
});

test('mute is reachable during replay, persists across reload, and fits the mobile header',async({page})=>{
  const mute=page.locator('.top-actions [data-sound-toggle]');
  await page.setViewportSize({width:390,height:844});await expect(mute).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.locator('#enable-camera').click();await page.locator('#start').click();await page.clock.runFor(8300);
  await expect(page.locator('#round-reveal')).toBeVisible();
  await page.locator('#round-reveal [data-sound-toggle]').click();
  await expect(mute).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>localStorage.getItem('meme-mirror-sound-v1'))).toBe('off');
  await page.locator('#reveal-reset').click();await expect(mute).toHaveAttribute('aria-label','Enable sound effects');
  await page.reload();await expect(mute).toHaveAttribute('aria-pressed','false');
  await mute.click();await expect(mute).toHaveAttribute('aria-pressed','true');
});

test('finale plays once, reveals scores after the drumroll, and reset cancels pending results',async({page})=>{
  await page.evaluate(async()=>{
    const {SoundEffects}=await import('/sounds.js');
    window.effects=[];const play=SoundEffects.prototype.play;
    SoundEffects.prototype.play=function(kind){const played=play.call(this,kind);window.effects.push({kind,played});return played;};
  });
  await page.locator('#enable-camera').click();await page.locator('#start').click();
  const skipFamily=async()=>{
    for(let i=0;i<6;i++){
      await page.clock.runFor(3200);await page.locator('#skip').click();
      if(i===2)await page.locator('#next').click();
    }
  };
  await skipFamily();
  expect(await page.evaluate(()=>window.effects)).toEqual([{kind:'finale',played:true}]);
  await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#phase-label')).toHaveText('DRUMROLL, PLEASE…');
  await page.clock.runFor(1000);await expect(page.locator('#summary')).toBeVisible();
  await page.clock.runFor(1000);expect(await page.evaluate(()=>window.effects.length)).toBe(1);
  await page.locator('#new-family').click();await page.locator('#start').click();await skipFamily();
  await page.locator('#reset').click();await page.clock.runFor(1200);
  await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#start')).toBeVisible();
});

test('effects render audible samples with a quiet tail, and muting stops scheduled voices',async({page})=>{
  await page.locator('#enable-camera').click();
  const results=await page.evaluate(async()=>{
    const {SoundEffects}=await import('/sounds.js');const results=[];
    for(const kind of ['success','finale']){
      const audio=new OfflineAudioContext(1,62400,48000),effect=new SoundEffects();
      // Offline contexts report suspended until rendering; supply the running gate.
      effect.context=new Proxy(audio,{get(target,key){if(key==='state')return 'running';const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
      effect.master=audio.createGain();effect.master.gain.value=.22;effect.master.connect(audio.destination);
      effect.play(kind);const samples=(await audio.startRendering()).getChannelData(0);
      results.push({kind,peak:Math.max(...samples.map(Math.abs)),tail:Math.max(...samples.slice(57600).map(Math.abs))});
    }
    const muted=new SoundEffects();muted.unlock();await muted.context.resume();muted.play('finale');
    const scheduled=muted.voices.size;muted.toggle();
    results.push({scheduled,remaining:muted.voices.size,blocked:muted.play('success')===false});
    await muted.context.close();return results;
  });
  for(const result of results.slice(0,2)){expect(result.peak).toBeGreaterThan(.01);expect(result.peak).toBeLessThan(.3);expect(result.tail).toBeLessThan(.001);}
  expect(results[2].scheduled).toBeGreaterThan(0);expect(results[2].remaining).toBe(0);expect(results[2].blocked).toBe(true);
});

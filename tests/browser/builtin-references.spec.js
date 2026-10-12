import { test, expect } from '@playwright/test';
test.beforeEach(async({context})=>{
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort('internetdisconnected'));
});

test('bundled photos are detectable, repeatable and discriminating on both CPU and GPU', async({page})=>{
  await page.goto('/');
  const results=await page.evaluate(async()=>{
    const {BUILTIN_REFERENCES}=await import('/builtin-references.js');
    const {EXPRESSIONS,FEATURES,measurements,matchScore}=await import('/scoring.js');
    const rows=[];
    for(const preference of ['CPU','GPU']){
      const worker=new Worker('/vision-worker.js');let id=0;
      const request=(data,transfers=[])=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Model timeout')),45000);worker.onmessage=e=>{clearTimeout(timer);e.data.error?reject(new Error(e.data.error)):resolve(e.data);};worker.postMessage({id:++id,...data},transfers);});
      const ready=await request({type:'init',delegate:preference});
      for(const [key,ref]of Object.entries(BUILTIN_REFERENCES)){
        const img=new Image();img.src=ref.image;await img.decode();
        const bitmap=await createImageBitmap(img);
        const result=await request({type:'reference',bitmap},[bitmap]);
        const sample=measurements(result.categories);
        const profile={...EXPRESSIONS.find(e=>e.id===key),...ref};
        const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#faf8f2';ctx.fillRect(0,0,640,480);
        const scale=Math.min(640/img.width,480/img.height);ctx.drawImage(img,(640-img.width*scale)/2,(480-img.height*scale)/2,img.width*scale,img.height*scale);
        const videoBitmap=await createImageBitmap(canvas);
        const video=await request({type:'frame',bitmap:videoBitmap,time:performance.now()},[videoBitmap]);
        const videoSample=measurements(video.categories);
        const neutral=Object.fromEntries(Object.keys(FEATURES).map(k=>[k,0]));
        const other={...neutral,...EXPRESSIONS.find(e=>e.id==='surprise').target};
        rows.push({expression:key,delegate:ready.delegate,photoFaces:result.count,videoFaces:video.count,photoScore:matchScore(sample,profile),videoScore:matchScore(videoSample,profile),neutralScore:matchScore(neutral,profile),otherPhotoScore:matchScore(other,profile)});
      }
      worker.terminate();
    }
    return rows;
  });
  console.log('Selected-reference checks:',JSON.stringify(results));
  for(const row of results){expect(row.photoFaces).toBe(1);expect(row.videoFaces).toBe(1);expect(row.photoScore).toBeGreaterThan(85);expect(row.videoScore).toBeGreaterThan(80);expect(row.neutralScore).toBe(0);expect(row.otherPhotoScore).toBeLessThan(75);}
});

test('checked photos are the defaults and all original illustrated defaults can be selected',async({page})=>{
  await page.goto('/');await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/memes/grin.png');await expect(page.locator('#reference-kind')).toHaveText('ANALYSED HUMAN PHOTO');
  await page.locator('#operator-open').click();await page.locator('#reference-set').selectOption('demo');await page.locator('#operator-close').click();
  await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/smile.svg');await page.reload();await expect(page.locator('#reference-kind')).toHaveText('ILLUSTRATED DEMO');
  await page.locator('#operator-open').click();await page.locator('#reference-set').selectOption('checked');await page.locator('#restore-demo').click();await page.locator('#operator-close').click();
  await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/smile.svg');await page.reload();await expect(page.locator('#reference-kind')).toHaveText('ILLUSTRATED DEMO');
  await page.locator('#operator-open').click();await page.locator('#restore-defaults').click();await page.locator('#operator-close').click();
  await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/memes/grin.png');
});

test('real model completes the grin and Next uses the restored original surprise demo',async({page})=>{
  // A static photo streamed through a native video track, not a real participant.
  await page.addInitScript(()=>{
    navigator.mediaDevices.getUserMedia=async()=>{
      let img=new Image();let imageUrl='/assets/memes/grin.png';img.src=imageUrl;await img.decode();let loading=false;
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
      const ctx=canvas.getContext('2d');
      const draw=()=>{
        const source=document.getElementById('reference-image')?.getAttribute('src');
        if(source&&source!==imageUrl&&!loading){loading=true;const next=new Image();next.src=source;next.decode().then(()=>{img=next;imageUrl=source;loading=false;}).catch(()=>{loading=false;});}
        const scale=Math.min(640/img.width,480/img.height);ctx.fillStyle='#faf8f2';ctx.fillRect(0,0,640,480);ctx.drawImage(img,(640-img.width*scale)/2,(480-img.height*scale)/2,img.width*scale,img.height*scale);
      };
      draw();const timer=setInterval(draw,40);const stream=canvas.captureStream(24);
      stream.getVideoTracks()[0].addEventListener('ended',()=>clearInterval(timer));return stream;
    };
  });
  await page.goto('/');await page.locator('#operator-open').click();await page.locator('#delegate').selectOption('CPU');await page.locator('#reconnect').click();await page.locator('#operator-close').click();
  await expect(page.locator('#start')).toBeEnabled();await page.locator('#start').click();
  await expect(page.locator('#round-reveal')).toBeVisible({timeout:30000});
  const score=parseInt(await page.locator('#reveal-score').textContent());expect(score).toBeGreaterThan(80);
  expect(await page.locator('#reveal-photo').evaluate(canvas=>[canvas.width,canvas.height])).toEqual([640,480]);
  await page.screenshot({path:'test-results/real-model-reference-reveal.png',fullPage:true});
  await expect(page.locator('#round-reveal')).toBeHidden({timeout:6000});await expect(page.locator('#next')).toBeEnabled();
  await page.locator('#next').click();await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/surprise.svg');
  await expect(page.locator('#reference-kind')).toHaveText('ILLUSTRATED DEMO');
});

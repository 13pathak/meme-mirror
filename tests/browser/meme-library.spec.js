import {test,expect} from '@playwright/test';
import { cameraStub as cameraStub } from './camera-stub.js';
test('emoji chooser cancels safely, persists three choices and uses them for both players',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/camera.js',route=>route.fulfill({contentType:'text/javascript',body:cameraStub}));
  await page.clock.install();await page.goto('/');
  await page.locator('#choose-memes').click();await expect(page.locator('.meme-tile')).toHaveCount(6);
  await page.locator('[data-meme="smile"]').click();await expect(page.locator('#apply-memes')).toBeDisabled();
  await page.clock.runFor(100);await page.locator('#library-close').click();
  await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/memes/grin.png');
  await page.locator('#choose-memes').click();
  for(const id of ['smile','surprise','pout','wink','laugh','scowl'])await page.locator(`[data-meme="${id}"]`).click();
  await expect(page.locator('#apply-memes')).toBeEnabled();await page.locator('#apply-memes').click();
  await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/wink.svg');
  await page.reload();await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/wink.svg');
  await page.locator('#choose-memes').click();await page.screenshot({path:'test-results/emoji-meme-library.png',fullPage:true});await page.locator('#library-close').click();
  await page.locator('#enable-camera').click();await page.locator('#start').click();await expect(page.locator('#choose-memes')).toBeDisabled();
  for(let round=0;round<6;round++){
    await expect(page.locator('#reference-image')).toHaveAttribute('src',`/assets/${['wink','laugh','scowl'][round%3]}.svg`);
    await page.clock.runFor(13000);await expect(page.locator('#phase-label')).toHaveText('ROUND COMPLETE');await page.locator('#next').click();
    if(round===2){await expect(page.locator('#prompt')).toHaveText('Your turn, parent!');await page.locator('#next').click();}
  }
  await expect(page.locator('#summary')).toBeVisible();await expect(page.locator('#round-summary')).toContainText('The secret snack');
  await page.locator('#new-family').click();await expect(page.locator('#choose-memes')).toBeEnabled();expect(errors).toEqual([]);
});

test('operator fallback restores the original three and the mobile chooser keeps Apply visible',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('meme-mirror-round-memes-v1',JSON.stringify(['wink','laugh','scowl'])));
  await page.goto('/');await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/wink.svg');
  await page.locator('#operator-open').click();await page.locator('#reference-set').selectOption('demo');await page.locator('#restore-defaults').click();await page.locator('#operator-close').click();
  await expect(page.locator('#reference-image')).toHaveAttribute('src','/assets/smile.svg');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('meme-mirror-round-memes-v1')))).toEqual(['smile','surprise','pout']);
  await page.setViewportSize({width:390,height:844});await page.locator('#choose-memes').click();
  await expect(page.locator('#apply-memes')).toBeInViewport();await expect(page.locator('#library-close')).toBeInViewport();
  await page.screenshot({path:'.test-tools/emoji-library-mobile.png',fullPage:true});
});

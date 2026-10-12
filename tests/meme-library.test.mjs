import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MEMES, validSelection, selectedProfiles } from '../public/meme-library.js';
import { FEATURES, EXPRESSIONS, measurements, matchScore, LEGACY_FEATURES } from '../public/scoring.js';
import { validatePack, MODEL } from '../public/references.js';
test('families select exactly three different available memes',()=>{
  assert.ok(validSelection(DEFAULT_MEMES));assert.ok(validSelection(['wink','laugh','scowl']));
  for(const value of [[],['smile','wink'],['wink','wink','laugh'],['smile','surprise','unknown']])assert.equal(validSelection(value),false);
  assert.deepEqual(selectedProfiles(['wink','laugh','scowl'],{}).map(e=>e.id),['wink','laugh','scowl']);
});
test('wink accepts either eye and penalises closing both eyes',()=>{
  const categories=Object.fromEntries(Object.values(FEATURES).flat().map(key=>[key,0]));
  const convert=values=>measurements(Object.entries(values).map(([categoryName,score])=>({categoryName,score})));
  const left=convert({...categories,eyeBlinkLeft:.9,eyeBlinkRight:.1,mouthSmileLeft:.35,mouthSmileRight:.35});
  const right=convert({...categories,eyeBlinkRight:.9,eyeBlinkLeft:.1,mouthSmileLeft:.35,mouthSmileRight:.35});
  assert.deepEqual(left,right);
  const both=convert({...categories,eyeBlinkLeft:.9,eyeBlinkRight:.9,mouthSmileLeft:.35,mouthSmileRight:.35});
  const wink=EXPRESSIONS.find(e=>e.id==='wink');assert.ok(matchScore(left,wink)>80);assert.ok(matchScore(both,wink)<20);
});
test('existing eight-feature photo packs remain valid without invented new targets',()=>{
  const target=Object.fromEntries(LEGACY_FEATURES.map(k=>[k,0]));target.smile=.7;
  const pack=validatePack({smile:{model:MODEL,image:'data:image/png;base64,AA==',caption:'A smile',target}});
  assert.deepEqual(pack.smile.target,target);assert.equal(pack.smile.target.wink,undefined);
});

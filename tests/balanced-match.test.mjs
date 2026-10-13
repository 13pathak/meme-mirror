import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPRESSIONS, FEATURES, MATCH_RULES, matchScore } from '../public/scoring.js';
import { BUILTIN_REFERENCES } from '../public/builtin-references.js';
import { Game } from '../public/game.js';

const neutral = Object.fromEntries(Object.keys(FEATURES).map(k => [k, 0]));
const profiles = [...EXPRESSIONS, { ...EXPRESSIONS[0], ...BUILTIN_REFERENCES.smile }];
const scaled = (expression, factor) => ({ ...neutral, ...Object.fromEntries(Object.entries(expression.target).map(([k,v]) => [k, Math.min(1,v*factor)])) });
for (const expression of profiles) {
  test(`${expression.name}: moderate and stronger variations pass; weak and contradictory faces do not`, () => {
    for (const factor of [.7,.85,1,1.15,1.3]) {
      assert.ok(matchScore(scaled(expression,factor),expression) >= MATCH_RULES.start, `variation ${factor}`);
    }
    for (const factor of [0,.25,.5]) assert.ok(matchScore(scaled(expression,factor),expression) < MATCH_RULES.start);
    for (const key of Object.keys(expression.conflicts)) {
      const sample = { ...scaled(expression,1), [key]: 1 };
      if (1 - (expression.target[key] || 0) - .12 >= .6) assert.ok(matchScore(sample,expression) < MATCH_RULES.sustain, `conflict ${key}`);
    }
  });
}
test('secondary cues cannot replace a defining movement', () => {
  const cases = { surprise: [{ jaw:.55 },{ brow:.5,wide:.4 }], laugh: [{ smile:.8 }],
    wink: [{ smile:.35,blinkBoth:.9 }], scowl: [{ press:.3 }], pout: [{ funnel:.25 }] };
  for (const [id,samples] of Object.entries(cases)) {
    for (const sample of samples) assert.ok(matchScore({ ...neutral,...sample },EXPRESSIONS.find(e=>e.id===id)) < MATCH_RULES.sustain,id);
  }
});
test('different feature proportions still qualify without copying the reference exactly', () => {
  const samples={ smile:{smile:.85,brow:.4}, surprise:{brow:.35,wide:.2,jaw:.7},
    pout:{pucker:.6,funnel:.1}, wink:{wink:.65,smile:.1},
    laugh:{smile:.7,squint:.15,jaw:.5}, scowl:{browDown:.45,press:.1} };
  for(const profile of profiles) assert.ok(matchScore({...neutral,...samples[profile.id]},profile)>=MATCH_RULES.start,profile.name);
});
test('unrelated preset expressions do not pass each other, except a laugh can count as a smile', () => {
  for (const target of EXPRESSIONS) for (const attempt of EXPRESSIONS) {
    if (target.id === attempt.id || (target.id === 'smile' && attempt.id === 'laugh')) continue;
    assert.ok(matchScore({ ...neutral,...attempt.target },target) < MATCH_RULES.start, `${attempt.id} for ${target.id}`);
  }
});
const holding = () => { const game = new Game(); game.start(0); game.phase='hold'; game.remaining=10000; return game; };
test('neutral, weak, and just-below-threshold attempts time out without a stored score', () => {
  for (const score of [0,30,54.99]) {
    const game=holding();
    for (let t=0;t<=10000;t+=100) { game.ingest(score,t); game.tick(t); }
    assert.equal(game.phase,'failed'); assert.equal(game.holdProgress,0); assert.equal(game.scores[0][0],undefined);
    game.retry(10100); assert.equal(game.phase,'prep');
  }
});
test('recognizable but varying matches complete without requiring score stability', () => {
  const game=holding(), scores=[60,65,48,62,70,58,61,72,64,60,65];
  scores.forEach((score,i)=>game.ingest(score,i*100));
  assert.equal(game.phase,'result'); assert.equal(game.result,Math.round(scores.reduce((a,b)=>a+b,0)/scores.length));
});
test('brief detection dip pauses progress and recovers without starting over', () => {
  const game = holding();
  for (let t=0;t<=600;t+=100) game.ingest(65,t);
  game.ingest(20,700); assert.equal(game.holdProgress,.6);
  game.ingest(65,800); assert.equal(game.holdProgress,.6);
  for (let t=900;t<=1200;t+=100) game.ingest(65,t);
  assert.equal(game.phase,'result'); assert.equal(game.result,65);
});
test('sustained wrong expression clears the hold; a later good attempt still succeeds', () => {
  const game=holding();
  for(let t=0;t<=600;t+=100)game.ingest(70,t);
  for(let t=700;t<=1100;t+=100)game.ingest(20,t);
  assert.equal(game.holdProgress,0);
  for(let t=1200;t<2200;t+=100)game.ingest(60,t);
  assert.equal(game.phase,'hold'); game.ingest(60,2200); assert.equal(game.phase,'result');
});
test('one good frame followed by borderline scores cannot pass on hysteresis alone', () => {
  const game=holding(); game.ingest(80,0);
  for(let t=100;t<=2000;t+=100)game.ingest(45,t);
  assert.equal(game.phase,'hold'); assert.ok(game.holdProgress<1);
  game.ingest(55,2100); assert.equal(game.phase,'hold');
});
test('a corrected match is judged on the latest hold rather than all earlier borderline scores', () => {
  const game=holding(); game.ingest(55,0);
  for(let t=100;t<=7000;t+=100)game.ingest(45,t);
  assert.equal(game.phase,'hold');
  for(let t=7100;t<=8200;t+=100)game.ingest(60,t);
  assert.equal(game.phase,'result'); assert.ok(game.result>=55);
});
test('cannot finish on a dip, stale gap, duplicate timestamp, or without enough samples', () => {
  const game=holding();
  for(let t=0;t<=900;t+=100)game.ingest(65,t);
  game.ingest(0,1000); assert.equal(game.phase,'hold');
  game.ingest(65,1100); assert.equal(game.phase,'hold');
  game.ingest(65,1100); assert.equal(game.phase,'hold');
  game.ingest(65,1700); assert.equal(game.holdProgress,0);
  assert.equal(game.samples.length,1);
  const sparse=holding(); sparse.timing.stale=2000;
  sparse.ingest(65,0); sparse.ingest(65,1000); assert.equal(sparse.phase,'hold');
  sparse.ingest(65,1100); assert.equal(sparse.phase,'result');
});
test('tracking loss restarts the hold and clears old matching samples', () => {
  const game=holding();
  game.ingest(65,0);game.ingest(65,400);game.ingest(null,500);
  assert.equal(game.holdProgress,0);game.ingest(65,600);game.ingest(65,1000);
  assert.equal(game.phase,'hold');game.ingest(65,1400);assert.equal(game.phase,'hold');game.ingest(65,1600);
  assert.equal(game.phase,'result');assert.equal(game.result,65);
});
test('the threshold itself passes and retry removes the previous score', () => {
  const game=holding(); for(let t=0;t<=1000;t+=100)game.ingest(55,t);
  assert.equal(game.phase,'result'); assert.equal(game.result,55);
  game.retry(1100); assert.equal(game.phase,'prep'); assert.equal(game.scores[0][0],undefined);
});

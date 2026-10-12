import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPRESSIONS, FEATURES, matchScore, measurements, Smoother, validateReference } from '../public/scoring.js';
import { Game } from '../public/game.js';
const neutral = () => Object.fromEntries(Object.keys(FEATURES).map(k => [k, 0]));
for (const expression of EXPRESSIONS) {
  test(`${expression.id}: correct movement beats neutral and conflict`, () => {
    const match = { ...neutral(), ...expression.target };
    const conflict = { ...neutral(), ...(expression.id === 'smile' ? { pucker: .9 } : { smile: .9 }) };
    assert.equal(matchScore(match, expression), 100);
    assert.ok(matchScore(match, expression) > matchScore(conflict, expression) + 50);
    assert.equal(matchScore(neutral(), expression), 0);
  });
  test(`${expression.id}: unused inactive measurements add no points`, () => {
    const sample = { ...neutral(), ...expression.target, unrelatedInactiveFeature: 0 };
    assert.equal(matchScore(sample, expression), matchScore({ ...sample, unrelatedInactiveFeature: 1 }, expression));
  });
}
test('Missing or malformed measurements do not produce a score', () => {
  for (const sample of [null, undefined, {}, { ...neutral(), jaw: NaN }]) assert.equal(matchScore(sample, EXPRESSIONS[0]), null);
  assert.equal(measurements([]), null);
  assert.equal(measurements([{ categoryName: 'jawOpen', score: .4 }]), null);
});
test('Missing active features and conflicting movement reduce score', () => {
  const surprise = EXPRESSIONS[1]; const match = { ...neutral(), ...surprise.target };
  assert.ok(matchScore({ ...match, jaw: 0 }, surprise) < 60);
  assert.ok(matchScore({ ...match, smile: .9 }, surprise) < 80);
});
test('Left/right swap does not change the symmetrised measurements', () => {
  const categories = Object.values(FEATURES).flat().map((categoryName, i) => ({ categoryName, score: i / 30 }));
  const swapped = categories.map(c => ({ ...c, categoryName: c.categoryName.endsWith('Left') ? c.categoryName.replace('Left','Right') : c.categoryName.replace('Right','Left') }));
  assert.deepEqual(measurements(categories), measurements(swapped));
});
test('Neutral references rejected; smoothing resets on tracking loss', () => {
  assert.ok(validateReference(neutral(), EXPRESSIONS[0]));
  const s = new Smoother(); s.update({ smile: 1 }, 0);
  assert.ok(s.update({ smile: 0 }, 100).smile > 0);
  s.update(null, 200); assert.equal(s.update({ smile: 0 }, 300).smile, 0);
});
test('Full game uses three rounds per player and reset clears scores', () => {
  const game = new Game({ prep: 100, attempt: 100, hold: 100, holdDeadline: 500, stale: 60, minSamples: 3, lostLimit: 500 });
  let now = 0; game.start(now);
  for (let i = 0; i < 6; i++) {
    if (game.phase === 'switch') game.next(now);
    while (!['result','failed'].includes(game.phase)) { now += 25; game.ingest(i * 10, now); game.tick(now); }
    assert.equal(game.phase, 'result'); assert.equal(game.result, i * 10); game.next(now);
  }
  assert.equal(game.phase, 'complete'); assert.deepEqual(game.scores, [[0,10,20],[30,40,50]]);
  game.reset(); assert.deepEqual(game.scores, [[],[]]); assert.equal(game.live, null);
});
test('Tracking loss invalidates hold and never finalises a stale score', () => {
  const game = new Game(); game.start(0); game.tick(3000); game.ingest(90, 3000); game.tick(10000);
  assert.equal(game.phase, 'attempt'); assert.equal(game.live, null);
  game.phase = 'hold'; game.remaining = 5000; game.ingest(90, 10000); game.ingest(90, 10100);
  game.ingest(null, 10200); assert.equal(game.samples.length, 0);
  game.tick(26000); assert.equal(game.phase, 'failed'); assert.deepEqual(game.scores, [[],[]]);
});
test('Fluctuating low scores complete a one-second hold without restarting', () => {
  const game = new Game(); game.start(0); game.phase = 'hold'; game.remaining = 2500;
  const scores = [0,30,5,40,0,35,5,30,0,40,5];
  for (let i=0;i<scores.length;i++) {
    game.ingest(scores[i],i*100);
    if (i<10) {assert.equal(game.phase,'hold');assert.equal(game.samples.length,i+1);assert.equal(game.holdProgress,i/10);}
  }
  assert.equal(game.phase,'result');assert.equal(game.result,Math.round(scores.reduce((a,b)=>a+b,0)/scores.length));
  assert.ok(game.result<25);
});
test('A tracked zero-score attempt completes; retry replaces the round score', () => {
  const game = new Game(); game.start(0); game.phase = 'hold';
  for (let t = 0; t <= 1000; t += 100) game.ingest(0, t);
  assert.equal(game.phase, 'result');assert.equal(game.result,0);game.retry(1100);assert.equal(game.phase,'prep');assert.equal(game.scores[0][0],undefined);
});
test('Lost tracking restarts the short hold; old samples cannot complete it',()=>{
  const game=new Game();game.start(0);game.phase='hold';game.remaining=2500;
  game.ingest(15,0);game.ingest(20,400);game.ingest(null,500);
  assert.equal(game.holdProgress,0);game.ingest(10,600);game.ingest(10,1000);
  assert.equal(game.phase,'hold');game.ingest(10,1400);assert.equal(game.phase,'hold');game.ingest(10,1600);
  assert.equal(game.phase,'result');assert.equal(game.result,10);
});

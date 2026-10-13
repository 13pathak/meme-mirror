import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/game.js';

test('skip works while attempting, holding or failed, clears tracking and records zero', () => {
  for (const phase of ['attempt','hold','failed']) {
    const game = new Game(); game.start(0); game.phase = phase;
    game.ingest(80,100); game.ingest(80,200);
    assert.equal(game.canSkip,true); game.skip(250);
    assert.equal(game.phase,'prep'); assert.equal(game.round,1);
    assert.deepEqual(game.scores,[[0],[]]); assert.deepEqual(game.skipped,[[true],[]]);
    assert.equal(game.live,null); assert.equal(game.result,null); assert.equal(game.holdProgress,0);
    assert.equal(game.samples.length,0);
    game.skip(251); assert.equal(game.round,1); // A double click cannot skip the next countdown.
  }
});

test('skip preserves earned scores, handles both third rounds and reset clears skipped flags', () => {
  const game = new Game(); game.start(0); game.phase='hold';
  for(let t=0;t<=1000;t+=100)game.ingest(80,t);
  game.next(1100);
  for(let round=1;round<3;round++){game.phase='failed';game.skip(1200+round);}
  assert.equal(game.phase,'switch'); assert.deepEqual(game.scores[0],[80,0,0]);
  game.next(1300); assert.equal(game.player,1); assert.equal(game.round,0);
  for(let round=0;round<3;round++){game.phase='attempt';game.skip(1400+round);}
  assert.equal(game.phase,'complete'); assert.deepEqual(game.scores[1],[0,0,0]);
  assert.deepEqual(game.scores.map(scores=>scores.reduce((a,b)=>a+b,0)),[80,0]);
  game.reset(); assert.deepEqual(game.skipped,[[],[]]); assert.deepEqual(game.scores,[[],[]]);
});

test('skip cannot overwrite a completed round or advance idle, countdown, handover or summary', () => {
  for(const phase of ['idle','prep','result','switch','complete']) {
    const game=new Game();game.phase=phase;game.scores[0][0]=85;
    assert.equal(game.canSkip,false);game.skip(100);
    assert.equal(game.phase,phase);assert.equal(game.round,0);assert.equal(game.scores[0][0],85);
    assert.deepEqual(game.skipped,[[],[]]);
  }
});

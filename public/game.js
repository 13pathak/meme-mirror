export const TIMING = { prep: 3000, attempt: 4000, hold: 1000, holdDeadline: 2500, lostLimit: 15000, stale: 500, minSamples: 3 };
export class Game {
  constructor(timing = TIMING) { this.timing = timing; this.reset(); }
  reset() {
    this.phase = 'idle'; this.player = 0; this.round = 0; this.scores = [[], []];
    this.sample = null; this.live = null; this.samples = []; this.lastSample = -Infinity; this.loss = 0;
  }
  start(now) { this.reset(); this.begin(now); }
  begin(now) { this.phase = 'prep'; this.remaining = this.timing.prep; this.lastTick = now; this.lastSample = -Infinity; this.live = null; this.samples = []; this.loss = 0; }
  ingest(score, now) {
    if (score == null || !Number.isFinite(score)) { this.invalidate(); return; }
    this.live = score; this.lastSample = now;
    if (this.phase === 'hold') {
      this.samples.push({ score, time: now });
      // Hold completion is about fresh tracking and time, not accuracy or score stability.
      // Keep the short continuous window even when someone adjusts their expression.
      if (this.samples.length >= this.timing.minSamples && now - this.samples[0].time >= this.timing.hold) {
        this.result = Math.round(this.samples.reduce((sum, x) => sum + x.score, 0) / this.samples.length);
        this.scores[this.player][this.round] = this.result;
        this.phase = 'result';
      }
    }
  }
  invalidate() { this.live = null; this.lastSample = -Infinity; this.samples = []; }
  tick(now) {
    const dt = Math.max(0, now - (this.lastTick ?? now)); this.lastTick = now;
    if (now - this.lastSample > this.timing.stale) this.invalidate();
    if (!['prep','attempt','hold'].includes(this.phase)) return;
    if (this.phase !== 'prep' && this.live == null) {
      this.loss += dt;
      if (this.loss >= this.timing.lostLimit) { this.phase = 'failed'; this.reason = 'Let’s find your face, then try this round again.'; }
      return;
    }
    this.loss = 0;
    this.remaining -= dt;
    if (this.remaining > 0) return;
    if (this.phase === 'prep') { this.phase = 'attempt'; this.remaining = this.timing.attempt; }
    else if (this.phase === 'attempt') { this.phase = 'hold'; this.remaining = this.timing.holdDeadline; this.samples = []; }
    else { this.phase = 'failed'; this.reason = 'The camera needs a fresh view. Look at the camera and retry.'; }
  }
  next(now) {
    if (this.phase === 'result') {
      if (this.round < 2) { this.round++; this.begin(now); }
      else if (this.player === 0) this.phase = 'switch';
      else this.phase = 'complete';
    } else if (this.phase === 'switch') { this.player = 1; this.round = 0; this.begin(now); }
  }
  retry(now) { if (['result','failed'].includes(this.phase)) { this.scores[this.player][this.round] = undefined; this.begin(now); } }
  get holdProgress() { return this.samples.length < 2 ? 0 : Math.min(1, (this.samples.at(-1).time - this.samples[0].time) / this.timing.hold); }
}

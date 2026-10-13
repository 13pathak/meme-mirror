import { MATCH_RULES } from './scoring.js';
export const TIMING = { prep: 3000, attempt: 4000, hold: 1000, holdDeadline: 10000, dipGrace: 250, lostLimit: 15000, stale: 500, minSamples: 3 };
export class Game {
  constructor(timing = TIMING) { this.timing = { ...TIMING, ...timing }; this.reset(); }
  reset() {
    this.phase = 'idle'; this.player = 0; this.round = 0; this.scores = [[], []];
    this.sample = null; this.live = null; this.clearHold(); this.lastSample = -Infinity; this.loss = 0;
  }
  start(now) { this.reset(); this.begin(now); }
  begin(now) { this.phase = 'prep'; this.remaining = this.timing.prep; this.lastTick = now; this.lastSample = -Infinity; this.live = null; this.clearHold(); this.loss = 0; }
  clearHold() { this.samples = []; this.held = 0; this.dipSince = null; }
  ingest(score, now) {
    if (score == null || !Number.isFinite(score)) { this.invalidate(); return; }
    if (now <= this.lastSample) return;
    const previousTime = this.lastSample;
    if (now - previousTime > this.timing.stale) this.clearHold();
    this.live = score; this.lastSample = now;
    if (this.phase === 'hold') {
      if (this.dipSince != null && now - this.dipSince > this.timing.dipGrace) this.clearHold();
      if (score < (this.samples.length ? MATCH_RULES.sustain : MATCH_RULES.start)) {
        if (this.samples.length && this.dipSince == null) this.dipSince = now;
        return;
      }
      // Brief dips pause progress; they cannot fill the hold or finish on a bad frame.
      if (this.samples.length && this.dipSince == null) this.held += now - previousTime;
      this.dipSince = null;
      this.samples.push({ score, time: now, held: this.held });
      // Judge the latest second, so a corrected expression is not dragged down
      // by earlier borderline samples for the rest of the attempt.
      while (this.samples.length > this.timing.minSamples && this.samples[1].held <= this.held - this.timing.hold) this.samples.shift();
      const average = this.samples.reduce((sum, x) => sum + x.score, 0) / this.samples.length;
      if (this.samples.length >= this.timing.minSamples && this.held >= this.timing.hold && average >= MATCH_RULES.start && score >= MATCH_RULES.start) {
        this.result = Math.round(average);
        this.scores[this.player][this.round] = this.result;
        this.phase = 'result';
      }
    }
  }
  invalidate() { this.live = null; this.lastSample = -Infinity; this.clearHold(); }
  tick(now) {
    const dt = Math.max(0, now - (this.lastTick ?? now)); this.lastTick = now;
    if (now - this.lastSample > this.timing.stale) this.invalidate();
    if (this.dipSince != null && now - this.dipSince > this.timing.dipGrace) this.clearHold();
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
    else if (this.phase === 'attempt') { this.phase = 'hold'; this.remaining = this.timing.holdDeadline; this.clearHold(); }
    else { this.phase = 'failed'; this.reason = 'Not quite a match yet. Follow the expression cue and try again—no exact copy needed.'; }
  }
  next(now) {
    if (this.phase === 'result') {
      if (this.round < 2) { this.round++; this.begin(now); }
      else if (this.player === 0) this.phase = 'switch';
      else this.phase = 'complete';
    } else if (this.phase === 'switch') { this.player = 1; this.round = 0; this.begin(now); }
  }
  retry(now) { if (['result','failed'].includes(this.phase)) { this.scores[this.player][this.round] = undefined; this.begin(now); } }
  get holdProgress() { return this.phase === 'result' ? 1 : Math.min(.99, this.held / this.timing.hold); }
}

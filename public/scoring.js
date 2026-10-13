// All features are movements, symmetrised across the subject's left/right sides.
export const FEATURES = {
  smile: ['mouthSmileLeft', 'mouthSmileRight'],
  brow: ['browInnerUp', 'browOuterUpLeft', 'browOuterUpRight'],
  wide: ['eyeWideLeft', 'eyeWideRight'],
  jaw: ['jawOpen'], pucker: ['mouthPucker'], funnel: ['mouthFunnel'],
  frown: ['mouthFrownLeft', 'mouthFrownRight'],
  press: ['mouthPressLeft', 'mouthPressRight'],
  wink: ['eyeBlinkLeft', 'eyeBlinkRight'],
  blinkBoth: ['eyeBlinkLeft', 'eyeBlinkRight'],
  squint: ['eyeSquintLeft', 'eyeSquintRight'],
  browDown: ['browDownLeft', 'browDownRight'],
};
export const LEGACY_FEATURES = ['smile','brow','wide','jaw','pucker','funnel','frown','press'];
export const EXPRESSIONS = [
  { id: 'smile', name: 'The holiday smile', caption: 'Tomorrow is a holiday!', cue: 'Lift the corners of your mouth. Big holiday energy!',
    target: { smile: .8 }, weights: { smile: 1 }, tolerance: .65, conflicts: { pucker: .55, frown: .5 }, color: 'yellow' },
  { id: 'surprise', name: 'The plot twist', caption: 'The test has a second page.', cue: 'Raise your eyebrows, widen your eyes, and open your mouth.',
    target: { brow: .5, wide: .4, jaw: .55 }, weights: { brow: .35, wide: .25, jaw: .4 }, tolerance: .6, conflicts: { smile: .4, pucker: .35 }, color: 'pink' },
  { id: 'pout', name: 'The samosa situation', caption: 'The last samosa is gone.', cue: 'Push your lips forward into a little pout. Keep your jaw relaxed.',
    target: { pucker: .7, funnel: .25 }, weights: { pucker: .8, funnel: .2 }, tolerance: .6, conflicts: { smile: .55, jaw: .45 }, color: 'blue' },
  { id: 'wink', name: 'The secret snack', caption: 'I definitely did not eat the last samosa.', cue: 'Close either eye for a wink and give a little smile. Keep the other eye open.',
    target: { wink: .7, smile: .35 }, weights: { wink: .8, smile: .2 }, tolerance: .65, conflicts: { blinkBoth: .7, jaw: .25 }, color: 'yellow' },
  { id: 'laugh', name: 'The serious assembly', caption: 'When your friend makes you laugh in assembly.', cue: 'Give a big grin, narrow your eyes, and open your mouth a little.',
    target: { smile: .8, squint: .4, jaw: .35 }, weights: { smile: .55, squint: .2, jaw: .25 }, tolerance: .65, conflicts: { pucker: .4, frown: .45 }, color: 'pink' },
  { id: 'scowl', name: 'The games-period plot', caption: 'Games period has become maths.', cue: 'Bring your eyebrows together and gently press your lips. No need to strain.',
    target: { browDown: .5, press: .3 }, weights: { browDown: .75, press: .25 }, tolerance: .65, conflicts: { smile: .5, brow: .4, jaw: .35 }, color: 'blue' },
];
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
// These are game thresholds, not a probability or a validated accuracy measure.
export const MATCH_RULES = { start: 55, sustain: 45, missingMovementCap: 44 };
export function measurements(categories) {
  if (!Array.isArray(categories) || !categories.length) return null;
  const map = Object.fromEntries(categories.map(c => [c.categoryName, c.score]));
  if (Object.values(FEATURES).flat().some(k => !Number.isFinite(map[k]))) return null;
  return Object.fromEntries(Object.entries(FEATURES).map(([key, names]) => {
    const values = names.map(n=>clamp(map[n]));
    const value = key === 'wink' ? Math.abs(values[0]-values[1]) : key === 'blinkBoth' ? Math.min(...values) : values.reduce((a,b)=>a+b,0)/values.length;
    return [key,value];
  }));
}
export function matchScore(sample, expression) {
  const required = [...LEGACY_FEATURES, ...Object.keys(expression.weights), ...Object.keys(expression.conflicts)];
  if (!sample || required.some(k => !Number.isFinite(sample[k]))) return null;
  const active = Object.entries(expression.weights).filter(([key, weight]) => weight > 0 && expression.target[key] >= .08);
  if (!active.length) return null;
  const total = active.reduce((s, [, w]) => s + w, 0);
  let error = 0, activation = 0;
  for (const [key, weight] of active) {
    const target = expression.target[key];
    // Allow a comfortable range around the reference. Stronger versions of the
    // same movement should not demand the reference person's exact intensity.
    const difference = sample[key] - target;
    const distance = Math.max(0, Math.abs(difference) - (.04 + .15 * target));
    error += weight * clamp(distance * (difference > 0 ? .4 : 1) / expression.tolerance);
    activation += weight * clamp(sample[key] / target);
  }
  let penalty = 0, strongConflict = false;
  for (const [key, weight] of Object.entries(expression.conflicts)) {
    const excess = clamp(sample[key] - (expression.target[key] || 0) - .12);
    penalty += weight * excess;
    if (weight > 0 && excess >= .6) strongConflict = true;
  }
  // A secondary movement must not compensate for the defining expression.
  // Surprise needs a mouth and an upper-face cue; laughter needs more than a smile.
  const primary = [...active].sort((a,b) => b[1] - a[1])[0][0];
  const groups = expression.id === 'surprise' ? [['jaw'], ['brow','wide']]
    : expression.id === 'laugh' ? [['smile'], ['squint','jaw']] : [[primary]];
  const missingMovement = groups.some(group => {
    const relevant = group.filter(key => active.some(([name]) => name === key));
    return relevant.length > 0 && !relevant.some(key => sample[key] >= Math.max(.1, expression.target[key] * .4));
  });
  const score = 100 * clamp((1 - error / total) * (activation / total) - penalty);
  return missingMovement || strongConflict ? Math.min(MATCH_RULES.missingMovementCap, score) : score;
}
export function validateReference(sample, expression) {
  if (!sample) return 'No usable expression measurements. Choose a clear, front-facing human photo.';
  const primary = Object.entries(expression.weights).sort((a,b) => b[1] - a[1])[0][0];
  if (sample[primary] < .15) return `This photo has very little ${primary} movement. Choose a stronger ${expression.id} expression.`;
  return null;
}
export class Smoother {
  clear() { this.value = null; this.time = null; }
  update(sample, time) {
    if (!sample) { this.clear(); return null; }
    const alpha = this.time == null ? 1 : 1 - Math.exp(-(time - this.time) / 180);
    this.value = Object.fromEntries(Object.keys(sample).map(k => [k, this.value == null ? sample[k] : this.value[k] + alpha * (sample[k] - this.value[k])]));
    this.time = time;
    return this.value;
  }
}

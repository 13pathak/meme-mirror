// All features are movements, symmetrised across the subject's left/right sides.
export const FEATURES = {
  smile: ['mouthSmileLeft', 'mouthSmileRight'],
  brow: ['browInnerUp', 'browOuterUpLeft', 'browOuterUpRight'],
  wide: ['eyeWideLeft', 'eyeWideRight'],
  jaw: ['jawOpen'], pucker: ['mouthPucker'], funnel: ['mouthFunnel'],
  frown: ['mouthFrownLeft', 'mouthFrownRight'],
  press: ['mouthPressLeft', 'mouthPressRight'],
};
export const EXPRESSIONS = [
  { id: 'smile', name: 'The holiday smile', caption: 'Tomorrow is a holiday!', cue: 'Lift the corners of your mouth. Big holiday energy!',
    target: { smile: .8 }, weights: { smile: 1 }, tolerance: .65, conflicts: { pucker: .55, frown: .5 }, color: 'yellow' },
  { id: 'surprise', name: 'The plot twist', caption: 'The test has a second page.', cue: 'Raise your eyebrows, widen your eyes, and open your mouth.',
    target: { brow: .5, wide: .4, jaw: .55 }, weights: { brow: .35, wide: .25, jaw: .4 }, tolerance: .6, conflicts: { smile: .4, pucker: .35 }, color: 'pink' },
  { id: 'pout', name: 'The samosa situation', caption: 'The last samosa is gone.', cue: 'Push your lips forward into a little pout. Keep your jaw relaxed.',
    target: { pucker: .7, funnel: .25 }, weights: { pucker: .8, funnel: .2 }, tolerance: .6, conflicts: { smile: .55, jaw: .45 }, color: 'blue' },
];
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export function measurements(categories) {
  if (!Array.isArray(categories) || !categories.length) return null;
  const map = Object.fromEntries(categories.map(c => [c.categoryName, c.score]));
  if (Object.values(FEATURES).flat().some(k => !Number.isFinite(map[k]))) return null;
  return Object.fromEntries(Object.entries(FEATURES).map(([key, names]) => [key, names.reduce((sum, n) => sum + clamp(map[n]), 0) / names.length]));
}
export function matchScore(sample, expression) {
  if (!sample || Object.keys(FEATURES).some(k => !Number.isFinite(sample[k]))) return null;
  const active = Object.entries(expression.weights).filter(([key, weight]) => weight > 0 && expression.target[key] >= .08);
  if (!active.length) return null;
  const total = active.reduce((s, [, w]) => s + w, 0);
  let error = 0, activation = 0;
  for (const [key, weight] of active) {
    const target = expression.target[key];
    error += weight * clamp(Math.abs(sample[key] - target) / expression.tolerance);
    activation += weight * clamp(sample[key] / target);
  }
  let penalty = 0;
  for (const [key, weight] of Object.entries(expression.conflicts)) {
    penalty += weight * clamp(sample[key] - (expression.target[key] || 0) - .12);
  }
  return 100 * clamp((1 - error / total) * (activation / total) - penalty);
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

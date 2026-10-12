import { MODEL } from './references.js';

// Targets measured from the actual supplied photos with the pinned local CPU model.
// The original demo presets remain in scoring.js and can be selected by the operator.
export const BUILTIN_REFERENCES = {
  smile: {
    model: MODEL, image: '/assets/memes/grin.png', caption: 'Tomorrow is a holiday!',
    name: 'The holiday grin', cue: 'Give a cheeky grin and raise your eyebrows. Keep your mouth slightly open.',
    target: { smile: 0.41061832010746, brow: 0.6437530120213827, wide: 0.19968177750706673,
      jaw: 0.17733021080493927, pucker: 0.0073303766548633575, funnel: 0.022906005382537842,
      frown: 0.0011647899518720806, press: 0.017213212326169014 },
    weights: { smile: .7, brow: .3 }, tolerance: .65,
    conflicts: { pucker: .55, frown: .5, jaw: .4 },
  },
  surprise: {
    model: MODEL, image: '/assets/memes/surprise.png', caption: 'The test has a second page.',
    cue: 'Raise your eyebrows and open your mouth in surprise. Make it comfortable!',
    target: { smile: 0.16822193562984467, brow: 0.4948161542415619, wide: 0.0940895639359951,
      jaw: 0.7549959421157837, pucker: 0.0039018532261252403, funnel: 0.025954719632864,
      frown: 0.015052113216370344, press: 0.010233999462798238 },
    // Eye-wide output is weak in this image; brows and jaw carry the useful signal.
    weights: { brow: .45, wide: .1, jaw: .45 }, tolerance: .65,
    conflicts: { smile: .4, pucker: .35 },
  },
};
export function effectiveReferences(overrides, defaultSet = 'checked') {
  const refs = defaultSet === 'checked' ? { ...BUILTIN_REFERENCES } : {};
  for (const [key, reference] of Object.entries(overrides)) {
    if (reference.demo) delete refs[key];
    else refs[key] = reference;
  }
  return refs;
}

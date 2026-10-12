import { MODEL } from './references.js';

// Target measured from the supplied grin photo with the pinned local CPU model.
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
};
export function effectiveReferences(overrides, defaultSet = 'checked') {
  const refs = defaultSet === 'checked' ? { ...BUILTIN_REFERENCES } : {};
  for (const [key, reference] of Object.entries(overrides)) {
    if (reference.demo) delete refs[key];
    else refs[key] = reference;
  }
  return refs;
}

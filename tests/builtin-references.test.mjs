import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_REFERENCES, effectiveReferences } from '../public/builtin-references.js';
import { EXPRESSIONS, FEATURES, matchScore, validateReference } from '../public/scoring.js';
import { MODEL } from '../public/references.js';
const neutral = Object.fromEntries(Object.keys(FEATURES).map(k=>[k,0]));
for (const [id, ref] of Object.entries(BUILTIN_REFERENCES)) {
  test(`${id}: bundled photo target beats neutral and the other selected photo`, () => {
    const profile={...EXPRESSIONS.find(e=>e.id===id),...ref};
    const other=Object.values(BUILTIN_REFERENCES).find(r=>r!==ref);
    assert.equal(ref.model,MODEL);assert.equal(validateReference(ref.target,profile),null);
    assert.equal(matchScore(ref.target,profile),100);assert.equal(matchScore(neutral,profile),0);
    assert.ok(matchScore(other.target,profile)<75);
  });
}
test('original demo targets and explicit slot overrides remain available', () => {
  assert.deepEqual(effectiveReferences({},'demo'),{});
  const refs=effectiveReferences({smile:{demo:true}});
  assert.equal(refs.smile,undefined);assert.equal(refs.surprise,BUILTIN_REFERENCES.surprise);assert.equal(refs.pout,undefined);
  const custom={caption:'A new photo',image:'custom.jpg',target:{smile:.7}};
  assert.equal(effectiveReferences({smile:custom}).smile,custom);
  assert.equal(effectiveReferences({smile:custom},'demo').smile,custom);
});

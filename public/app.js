import { EXPRESSIONS, MATCH_RULES, matchScore, Smoother, validateReference } from './scoring.js';
import { Game, TIMING } from './game.js';
import { VisionCamera } from './camera.js';
import { MODEL, readReferences, saveReferences, preparePhoto, validatePack } from './references.js';
import { RoundReveal } from './reveal.js';
import { ReplayBuffer } from './replay.js';
import { effectiveReferences } from './builtin-references.js';
import { DEFAULT_MEMES, MEME_ICONS, readSelection, saveSelection, selectedProfiles } from './meme-library.js';
const $ = selector => document.querySelector(selector);
const game = new Game(), smoother = new Smoother(), replay = new ReplayBuffer();
const reveal = new RoundReveal($('#round-reveal'), () => {
  if (game.phase === 'result') {
    $('#next').disabled = false;
    $('#retry').disabled = false;
    $('#next').focus({ preventScroll: true });
  }
});
let references = readReferences(), activeReferences, tracking = 'Your instant replay stays here briefly. Nothing is saved.', starting = false;
let defaultSet = 'checked';
try { if (localStorage.getItem('meme-mirror-default-set-v1') === 'demo') defaultSet = 'demo'; } catch {}
$('#reference-set').value = defaultSet;
let recent = [], lastResult, lastRendered = '', lastExpression = '', refBusy = false;
let chosenMemes = readSelection(), activeSelection = null, draftMemes = [];
const roundProfiles = () => selectedProfiles(activeSelection || chosenMemes, activeReferences || effectiveReferences(references, defaultSet));
const expression = () => roundProfiles()[game.round];
const status = message => { tracking = message; $('#tracking-message').textContent = message; $('#operator-status').textContent = message; };
const camera = new VisionCamera($('#camera'), result => {
  const now = performance.now();
  const { bitmap, ...readings } = result;
  lastResult = readings;
  recent = recent.filter(r => now - r.received < 3000);
  if (result.ms != null) recent.push(readings);
  if (result.count !== 1 || !result.sample || now - result.captured > TIMING.stale) {
    smoother.clear(); replay.clear(); game.ingest(null, now);
    if (camera.running) status(result.count > 1 ? 'One face at a time! Everyone else, step aside.' : result.count === 1 ? 'Tracking is catching up. Stay facing the camera.' : 'Step into view and face the camera.');
    return;
  }
  if (document.hidden || $('#operator').open) { smoother.clear(); replay.clear(); game.invalidate(); return; }
  const smoothed = smoother.update(result.sample, result.captured);
  const before = game.phase;
  if (result.captured - game.lastSample > TIMING.stale) replay.clear();
  game.ingest(matchScore(smoothed, expression()), result.captured);
  if (['attempt','hold'].includes(before) && game.live != null) replay.capture(bitmap, result.captured);
  if (before === 'hold' && game.phase === 'result') {
    reveal.show(replay.take(), expression(), game.result);
    render(now);
  }
  status('One face found. You’re in the spotlight!');
}, status);
camera.captureFrame = () => ['attempt','hold'].includes(game.phase) && !$('#operator').open;

function reset() {
  game.reset(); smoother.clear(); activeReferences = null; activeSelection = null; lastRendered = ''; lastExpression = '';
  reveal.hide(); replay.clear();
  document.body.classList.remove('celebrating'); render(performance.now());
}
function requireIdle() {
  if (game.phase !== 'idle') throw new Error('Reset the family before changing the setup.');
}
async function enableCamera() {
  if (starting || refBusy) return;
  starting = true; $('#enable-camera').disabled = true; $('#reconnect').disabled = true;
  try {
    requireIdle();
    camera.dispose();
    const devices = await camera.start($('#camera-select').value, $('#delegate').value);
    const selected = camera.stream.getVideoTracks()[0].getSettings().deviceId;
    $('#camera-select').replaceChildren(new Option('Default camera', ''), ...devices.map((d,i) => new Option(d.label || `Camera ${i+1}`, d.deviceId)));
    $('#camera-select').value = selected || '';
    status('Step into view and face the camera.');
  } catch (error) { status(error.message); }
  finally { starting = false; $('#enable-camera').disabled = false; $('#reconnect').disabled = false; render(performance.now()); }
}
function drawExpression() {
  const ref = expression(); const key = `${ref.id}:${ref.image || 'demo'}:${ref.caption}`;
  if (lastExpression === key) return; lastExpression = key;
  $('#reference-card').className = `reference-card ${ref.color}`;
  $('#reference-image').src = ref.image || `/assets/${ref.id}.svg`;
  $('#reference-image').classList.toggle('photo', !!ref.image);
  $('#reference-image').alt = ref.image ? `Operator reference: ${ref.name}` : `Demo illustration: ${ref.name}`;
  $('.sticker').hidden = !!ref.image;
  $('#reference-kind').textContent = ref.image ? 'ANALYSED HUMAN PHOTO' : 'ILLUSTRATED DEMO';
  $('#expression-name').textContent = ref.name.toUpperCase(); $('#caption').textContent = `“${ref.caption}”`; $('#cue').textContent = ref.cue;
}
function render(now) {
  drawExpression();
  const phase = game.phase, playing = ['prep','attempt','hold'].includes(phase), result = phase === 'result';
  $('#start').hidden = phase !== 'idle'; $('#start').disabled = !camera.running || starting || refBusy;
  $('#choose-memes').disabled = phase !== 'idle' || refBusy;
  $('#next').hidden = !['result','switch'].includes(phase);
  $('#next').disabled = $('#round-reveal').open;
  $('#retry').hidden = !['result','failed'].includes(phase);
  $('#retry').disabled = $('#round-reveal').open;
  $('#skip').hidden = !game.canSkip;
  $('#next').textContent = phase === 'switch' ? 'Start parent’s turn →' : game.round === 2 ? game.player === 0 ? 'Parent’s turn →' : 'See family scores →' : 'Next meme →';
  $('#camera-placeholder').hidden = camera.running;
  $('#camera-indicator').textContent = camera.running ? '● LIVE · ONLY ON THIS DEVICE' : 'CAMERA OFF';
  $('#enable-camera').textContent = starting ? 'Getting ready…' : 'Enable camera ↗';
  $('#countdown').hidden = phase !== 'prep'; $('#countdown').textContent = Math.max(1, Math.ceil(game.remaining / 1000));
  $('#turn-label').textContent = phase === 'complete' ? 'FAMILY COMPLETE!' : game.player === 0 ? 'CHILD’S TURN' : 'PARENT’S TURN';
  for (const round of document.querySelectorAll('[data-round]')) {
    const index = Number(round.dataset.round); const score = game.scores[game.player][index];
    round.querySelector('span:not(.round-score)').textContent = roundProfiles()[index].name;
    round.classList.toggle('active', index === game.round); round.classList.toggle('done', score != null && !game.skipped[game.player][index]);
    round.querySelector('.round-score').textContent = score == null ? '' : game.skipped[game.player][index] ? '· skipped (0)' : `· ${score}`;
  }
  const displayedScore = result ? game.result : playing ? game.live : null;
  $('#live-score').textContent = displayedScore == null ? '—' : Math.round(displayedScore);
  $('#meter-fill').style.width = `${displayedScore || 0}%`; $('.meter').setAttribute('aria-valuenow', Math.round(displayedScore || 0));
  $('#hold-progress').textContent = phase === 'hold' ? `${Math.round(game.holdProgress * 100)}% held` : '';
  const matching = game.live != null && game.live >= (game.samples.length ? MATCH_RULES.sustain : MATCH_RULES.start);
  $('#meter-note').textContent = phase === 'hold' ? `Aim for ${MATCH_RULES.start}+ and hold for one second. Small wobbles are okay.` : 'A playful game score, not an emotion reading.';
  const remaining = Math.max(0, Math.ceil(game.remaining / 1000));
  const renderKey = `${phase}:${game.player}:${game.round}:${remaining}:${game.live == null}:${matching}`;
  if (renderKey !== lastRendered) {
    lastRendered = renderKey;
    const text = {
      idle: ['READY WHEN YOU ARE', 'A smile is a great place to start.', 'Child first, then parent. The same three memes for both.'],
      prep: [`ROUND ${game.round+1} OF 3 · GET READY`, 'Take a look. Make that face!', 'You have a few seconds to find your expression.'],
      attempt: ['COPY THE FACE', game.live == null ? 'Let’s get you back in view.' : `Try it out! ${remaining} seconds to play.`, game.live == null ? 'Your timer is paused. One face in the camera, please.' : expression().cue],
      hold: [matching ? 'NOW, HOLD IT' : 'FIND THE EXPRESSION', game.live == null ? 'Back in view, then hold again.' : matching ? 'That’s it—hold for one second!' : 'Copy the main expression. You have time!', matching ? 'Small wobbles are okay. No exact copy needed.' : expression().cue],
      result: ['ROUND COMPLETE', `${game.result} / 100 · ${game.result >= 75 ? 'What an expression!' : game.result >= 40 ? 'You brought it to life!' : 'Thanks for giving it a go!'}`, 'Your match score is the average of your short hold.'],
      failed: ['LET’S TRY THAT AGAIN', 'Retry or skip this meme.', `${game.reason || 'Face the camera and retry.'} ${expression().cue}`],
      switch: ['PASS THE SPOTLIGHT', 'Your turn, parent!', 'Same faces. Same challenge. A brand-new performance.'],
      complete: ['THAT’S A WRAP', 'A round of applause for both of you!', 'Your family’s expression scores are below.'],
    }[phase];
    $('#phase-label').textContent = text[0]; $('#prompt').textContent = text[1]; $('#subprompt').textContent = text[2];
  }
  $('#summary').hidden = phase !== 'complete';
  if (phase === 'complete') {
    document.body.classList.add('celebrating');
    const totals = game.scores.map(scores => scores.reduce((a,b) => a+b, 0));
    $('#child-total').textContent = totals[0]; $('#parent-total').textContent = totals[1];
    $('#comparison').textContent = totals[0] === totals[1] ? 'An expression tie! Great minds make great faces.' : `${totals[0] > totals[1] ? 'Child' : 'Parent'} takes the match-score ribbon. Both take the applause!`;
    const roundScore = (player, i) => game.skipped[player][i] ? 'skipped (0)' : game.scores[player][i];
    $('#round-summary').textContent = roundProfiles().map((e,i) => `${e.name}: child ${roundScore(0,i)} · parent ${roundScore(1,i)}`).join('   /   ');
  }
  if ($('#operator').open && lastResult) {
    const hz = recent.length > 1 ? (recent.length-1)*1000 / (recent.at(-1).received - recent[0].received) : 0;
    const ms = recent.length ? recent.reduce((s,r) => s+r.ms,0) / recent.length : 0;
    $('#diagnostics').textContent = `Delegate: ${camera.delegate || '—'} | Faces: ${lastResult.count}\nObserved inference rate (3 s): ${hz.toFixed(1)} Hz | Mean inference: ${ms.toFixed(1)} ms\nTarget: 12 Hz · camera request: 640 × 480\nActual camera: ${camera.video.videoWidth} × ${camera.video.videoHeight}\n${Object.entries(lastResult.sample || {}).map(([k,v]) => `${k}: ${v.toFixed(3)}`).join('  ')}\nGame phase: ${phase}`;
  }
}
function frame(now) {
  if (!document.hidden && !$('#operator').open) game.tick(now);
  else { game.lastTick = now; game.invalidate(); smoother.clear(); replay.clear(); }
  if (!['attempt','hold'].includes(game.phase) || game.live == null) replay.clear();
  render(now); requestAnimationFrame(frame);
}
$('#enable-camera').onclick = enableCamera;
$('#start').onclick = () => { if (!camera.running || refBusy) return; activeSelection = [...chosenMemes]; activeReferences = structuredClone(effectiveReferences(references, defaultSet)); smoother.clear(); game.start(performance.now()); };
$('#next').onclick = () => { if ($('#round-reveal').open) return; reveal.hide(); replay.clear(); smoother.clear(); game.next(performance.now()); if (game.phase === 'complete') { render(performance.now()); $('#summary').scrollIntoView({ behavior: 'smooth', block: 'center' }); } };
$('#retry').onclick = () => { if ($('#round-reveal').open) return; reveal.hide(); replay.clear(); smoother.clear(); game.retry(performance.now()); };
$('#skip').onclick = () => {
  if (!game.canSkip || $('#round-reveal').open) return;
  reveal.hide(); replay.clear(); smoother.clear(); game.skip(performance.now()); render(performance.now());
  if (game.phase === 'switch') $('#next').focus();
  if (game.phase === 'complete') { $('#summary').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#new-family').focus({ preventScroll: true }); }
};
$('#reset').onclick = reset; $('#new-family').onclick = () => { reset(); window.scrollTo({ top: 0 }); };
$('#reveal-reset').onclick = reset;
function openMemeLibrary() {
  if (game.phase !== 'idle' || refBusy) return;
  draftMemes=[...chosenMemes];
  const refs = effectiveReferences(references, defaultSet);
  for (const expression of EXPRESSIONS) {
    const tile = document.querySelector(`[data-meme="${expression.id}"]`);
    const selected = chosenMemes.indexOf(expression.id);
    tile.setAttribute('aria-pressed',selected>=0);
    tile.querySelector('.meme-round').textContent = selected>=0 ? `ROUND ${selected+1}` : 'ADD TO YOUR THREE';
    tile.querySelector('img').src = refs[expression.id]?.image || `/assets/${expression.id}.svg`;
  }
  $('#library-status').textContent = 'Pick three different memes. Both players get your same choices.';
  $('#meme-library').showModal();
}
$('#choose-memes').onclick = () => {openMemeLibrary();$('#apply-memes').disabled=false;};
$('#library-close').onclick = () => $('#meme-library').close();
for (const item of EXPRESSIONS) {
  const tile = document.createElement('button'); tile.type='button';tile.className=`meme-tile ${item.color}`;tile.dataset.meme=item.id;
  const image=document.createElement('img');image.alt=`${MEME_ICONS[item.id]} ${item.name}`;
  const badge=document.createElement('span');badge.className='meme-round';
  const name=document.createElement('strong');name.textContent=`${MEME_ICONS[item.id]} ${item.name}`;
  const caption=document.createElement('span');caption.className='meme-tile-caption';caption.textContent=item.caption;
  tile.append(badge,image,name,caption);
  tile.onclick=()=>{
    const next=[...draftMemes];const index=next.indexOf(item.id);
    if(index>=0)next.splice(index,1);
    else if(next.length<3)next.push(item.id);
    else {$('#library-status').textContent='Remove one selected meme first, then add your new choice.';return;}
    draftMemes=next;
    for(const button of $('#meme-options').children){const rank=next.indexOf(button.dataset.meme);button.setAttribute('aria-pressed',rank>=0);button.querySelector('.meme-round').textContent=rank>=0?`ROUND ${rank+1}`:'ADD TO YOUR THREE';}
    $('#library-status').textContent=`${next.length} of 3 selected. Selection order is the round order.`;
    $('#apply-memes').disabled=next.length!==3;
  };
  $('#meme-options').append(tile);
}
$('#apply-memes').onclick=()=>{
  try {requireIdle();saveSelection(draftMemes);chosenMemes=[...draftMemes];lastExpression='';$('#meme-library').close();render(performance.now());}
  catch(e){$('#library-status').textContent=e.message;}
};
$('#fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { status('Use Chrome’s F11 key for fullscreen.'); } };
$('#operator-open').onclick = () => { game.invalidate(); smoother.clear(); replay.clear(); $('#operator').showModal(); };
$('#operator-close').onclick = () => $('#operator').close();
$('#operator').addEventListener('close', () => { camera.paused = false; game.lastTick = performance.now(); });
$('#reconnect').onclick = enableCamera;
$('#stop-camera').onclick = () => { reset(); camera.dispose(); status('Camera is off. Enable it when you’re ready.'); };
$('#reference-slot').onchange = () => { const ref = EXPRESSIONS[Number($('#reference-slot').value)]; $('#reference-caption-input').value = references[ref.id]?.caption || ref.caption; $('#reference-status').textContent = ''; };
$('#reference-set').onchange = () => {
  try {
    requireIdle();
    if (refBusy) throw new Error('Wait for photo analysis to finish.');
    defaultSet = $('#reference-set').value; lastExpression = '';
    try { localStorage.setItem('meme-mirror-default-set-v1', defaultSet); } catch {}
    $('#reference-status').textContent = defaultSet === 'checked' ? 'Working grin selected. Surprise and pout keep their original demos; your saved slot overrides still apply.' : 'Original illustrated defaults selected. Your saved slot overrides still apply.';
  } catch (e) { $('#reference-set').value = defaultSet; $('#reference-status').textContent = e.message; }
};
$('#restore-defaults').onclick = () => {
  try {
    requireIdle();
    if (refBusy) throw new Error('Wait for photo analysis to finish.');
    saveSelection(DEFAULT_MEMES);chosenMemes=[...DEFAULT_MEMES];
    saveReferences({}); references = {}; lastExpression = '';
    $('#reference-status').textContent = 'All three slots now use the selected defaults.';
  } catch (e) { $('#reference-status').textContent = e.message; }
};
$('#save-reference').onclick = async () => {
  if (refBusy || starting) return;
  refBusy = true; $('#save-reference').disabled = true;
  const output = $('#reference-status'); output.textContent = 'Checking the photo with the local model…';
  try {
    requireIdle(); const slot = Number($('#reference-slot').value); const caption = $('#reference-caption-input').value.trim();
    if (!caption) throw new Error('Add a short caption first.');
    const photo = await preparePhoto($('#reference-file').files[0]);
    const result = await camera.analyse(photo.blob, $('#delegate').value);
    if (result.count !== 1) throw new Error(result.count > 1 ? 'More than one face found. Crop the photo to one person.' : 'No face found. Choose a clear, front-facing human photograph.');
    const problem = validateReference(result.sample, EXPRESSIONS[slot]); if (problem) throw new Error(problem);
    const next = { ...references, [EXPRESSIONS[slot].id]: { model: MODEL, caption, image: photo.image, target: result.sample } };
    saveReferences(next); references = next; lastExpression = ''; output.textContent = 'Saved! One human face analysed. This reference will be used for both players.';
    $('#reference-file').value = '';
  } catch (error) { output.textContent = error.name === 'QuotaExceededError' ? 'Chrome storage is full. Remove a saved reference or use a smaller photo.' : error.message; }
  finally { refBusy = false; camera.paused = false; $('#save-reference').disabled = false; }
};
$('#restore-demo').onclick = () => {
  try { requireIdle(); if (refBusy) throw new Error('Wait for photo analysis to finish.'); const next = { ...references, [EXPRESSIONS[Number($('#reference-slot').value)].id]: { demo: true } }; saveReferences(next); references = next; lastExpression = ''; $('#reference-status').textContent = 'Illustrated demo and preset target restored for this slot.'; } catch (e) { $('#reference-status').textContent = e.message; }
};
$('#export-references').onclick = () => {
  const blob = new Blob([JSON.stringify(references, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'meme-mirror-references.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('#import-references').onchange = async event => {
  try {
    requireIdle(); if (refBusy) throw new Error('Wait for photo analysis to finish.'); const file = event.target.files[0]; if (!file) return;
    if (file.size > 7000000) throw new Error('Reference pack is too large.');
    const next = validatePack(JSON.parse(await file.text())); saveReferences(next); references = next; lastExpression = ''; $('#reference-status').textContent = 'Reference pack imported. Use only packs exported from verified photos in this app.';
  } catch(e) { $('#reference-status').textContent = e.message; }
  finally { event.target.value = ''; }
};
document.addEventListener('visibilitychange', () => { if (document.hidden) reveal.hide(); replay.clear(); game.invalidate(); smoother.clear(); game.lastTick = performance.now(); });
window.addEventListener('pagehide', () => { reveal.hide(); replay.clear(); camera.dispose(); });
requestAnimationFrame(frame);

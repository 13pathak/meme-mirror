# Test results — 13 October 2026

## Sound effects update — 13 October 2026

- **7 targeted Chrome checks passed:** success replay and cleanup regressions, skipped-round flow, header/replay mute and persistence, one-shot family drumroll timing, reset during the pending finale, and audio rendering/muting.
- Native offline audio rendering produced nonzero, bounded waveforms with quiet tails for the rising success chime and short drumroll. Muting stops active and future scheduled voices; the preference survives reset/reload. The mobile header remains within the viewport.
- Audio is synthesised locally after a user gesture. No audio assets, external requests or microphone access were added. Sound-disabled/unavailable games show final scores immediately; audible finales introduce a 0.9-second drumroll before the scores. Check actual speaker volume during rehearsal.

## Instant replay update — 13 October 2026

- **45 unit tests and 10 targeted Chrome checks passed.** Successful imitation now shows the final 2.5 seconds of valid tracked frames as a mirrored replay, with the existing score, confetti and reveal duration.
- A changing synthetic frame verified that playback progresses through the captured colors in order, ends on the completion frame, ignores subsequent live-camera changes, and does not reuse old frames after Retry. Reset, page exit, skipped rounds and both-player skip flow passed their existing checks.
- Browser checks verified independent frame copies, mirroring, 640 × 480 size limits, the 32-frame/2.5-second bound, transfer of buffer ownership and pixel clearing. Reduced motion shows the final frame; missing image frames leave the successful result and Next usable.
- The real local model still detects/matches the bundled reference on CPU/GPU, and its synthetic-video round completes with a replay. These are automated checks; live replay smoothness still needs the exhibition laptop rehearsal.

## Confetti update — 13 October 2026

- The three existing Chrome reveal checks passed: timed reveal/Next unlock, reset cleanup, and retry/page-exit cleanup.
- A browser smoke check verified 48 decorative particles on a successful reveal, pointer events disabled, removal after 1.8 seconds, and no particles when reduced motion is requested. Inspected the burst at 1366 × 768 using a simulated camera frame.
- Confetti uses local CSS and DOM elements, with no extra library or network request. The reveal's existing close/reset cleanup removes it immediately.

## Skip meme update — 13 October 2026

- **45 unit tests and 6 targeted Chrome checks passed.** Skip is available during practice, holding and after a failed attempt, records zero with an explicit skipped label, clears the pending hold and advances without a success reveal.
- Tests cover preserving earned scores, preventing a double click from skipping the next countdown, both third-round transitions, all-skipped family totals, and reset cleanup. Existing matching/retry and photo-reveal checks still pass.
- Reviewed the failure controls at 1366 × 768 and 390 × 844. On mobile, the controls remain accessible by scrolling beneath the camera, with no horizontal overflow.

## Balanced matching update — 13 October 2026

- **42 unit tests and the full 17-test Chrome suite passed.** A round now needs a recognizable match: 55 to start, 45 to sustain, a 55+ mean over the latest qualifying second, and a 55+ finishing frame. Brief dips pause progress for up to 250 ms; sustained mismatches, missing faces, multiple faces and stale samples clear it.
- All six presets and the bundled grin accept synthetic 70–130% target-intensity variations and differing feature proportions. Neutral, weak, unrelated and strongly conflicting fixtures fail. Tests also cover missing defining movements, a single good frame followed by borderline scores, timestamp gaps, retry cleanup, and correction after earlier borderline samples.
- Browser tests verify that weak/neutral pout input never reveals a success or unlocks Next, a moderate retry succeeds, and a wrong expression can be corrected within the same 10-second hold window. Both-player flows, all six meme choices, reveal cleanup, tracking loss, offline requests and real CPU/GPU model checks passed.
- Real-model repeated grin-image scores were 100/99.4 (photo/video, CPU) and 96.5/94.4 (GPU). This verifies the existing reference still works, not that every human imitation will pass. Live adults/children, lighting and glasses still need the rehearsal in EXHIBITION-CHECKLIST.md.
- The older printed PDFs describe the previous permissive hold; README.md contains the current rules. Earlier results below are historical and their no-minimum-score behavior is superseded.

## Comfortable hold update — historical

- **26 unit tests and 13 Chrome checks passed across two targeted runs.** A weak, fluctuating samosa expression completed in the short hold without progress resets; its final match score remained below 50. The complete round, including preparation and practice, reached the reveal within 8.5 seconds in the controlled test.
- The hold is now **1 second with at least 3 fresh samples**, with no score-variation restart and no minimum match score. Unit tests cover fluctuating low scores, a tracked zero-score attempt, and tracking loss clearing the hold. Practice time is reduced from 7 to 4 seconds for every meme.
- Photo-reveal timing/cleanup, retries, parent/child turns, all six emoji choices, reference persistence, real CPU/GPU model execution, and the working-grin camera pipeline passed. The 2.5-second reveal remains unchanged.
- The weak-pout check uses simulated measurements and a synthetic frame, not a real participant. The change addresses the restrictive game rules; it does not claim a new live-camera benchmark or validated expression accuracy.

## Surprise revert and emoji meme chooser

- Restored the original plot-twist surprise illustration/target after user live feedback. The working grin is preserved. Static photo tests from the earlier version did not establish live usability of the retired surprise photograph.
- **24 unit tests passed**, including all six expression presets, three-choice validation, either-eye wink handling, two-eye-closure rejection, and compatibility with existing eight-feature reference packs.
- Four targeted Chrome checks passed: actual CPU/GPU inference still matches the working grin; its real-model round completes and Next loads the restored surprise SVG; default/demo overrides remain usable; the six-tile emoji chooser cancels safely, persists three choices and carries them through both players' complete turns.
- Ten existing Chrome regression checks also passed (camera/model execution, original three-round flow, reference import, permissions, fallback, timed photo reveal and cleanup), followed by a targeted operator-fallback/mobile-layout check. **15 browser checks passed in total across these runs.** Desktop/mobile chooser screenshots were inspected.
- New emoji targets are presets. Their scoring and flow are tested with synthetic measurements; live wink/laugh/scowl imitation still needs manual testing.

## Selected human-reference update

- **16 Node tests and the complete 13-test Chrome suite passed** with the selected human references and the original demos available.
- All four user-supplied photos produced exactly one face in both CPU and GPU modes. Photos 3 (grin) and 4 (surprise) were selected; none was suitable for pout. See `REFERENCE-CHECKS.md` for the measurements and selection reasons.
- The selected references were checked in original-image and 640 × 480 video form in both execution modes. Matching video frames scored **98.9/92.3 on CPU** and **90.8/95.7 on GPU** (grin/surprise); neutral vectors scored **0** and the opposite selected expression scored **16.4/26.6**.
- A native synthetic camera stream fed both reference photos through the actual CPU model, full round timing, stable hold and screenshot reveal: final round scores were **99 and 92**. These are repeated reference-image inputs, not real visitor imitation or a hardware performance benchmark.
- The original illustrated set, saved slot overrides, per-slot demo restoration, bulk default restoration and profile preference persistence passed. All **eight** model/runtime/reference files passed checksum verification. The new checks blocked external browser requests.

## Temporary steady-face reveal update

- The 13 scoring/state tests passed again after this update.
- Five existing Chrome checks passed with the updated worker/camera pipeline, including real CPU/GPU inference, full family flow, reference validation/persistence, permission denial, and synthetic camera capture. The real model returned the original one-face inference frame at its original resolution for the reveal.
- Three new Chrome reveal checks passed: the hold-completion frame is mirrored and frozen with the averaged match score; the reveal lasts 2.5 seconds and then unlocks the next expression; its canvas pixels clear on expiry, Reset, retry and page exit; multiple-face/tracking failure cannot produce a picture. The screenshots use an explicitly simulated camera drawing, not a participant. No picture was written to localStorage or uploaded.
- The percentage is labelled **Expression match** on a game scale. Real people and the exhibition hardware still need the manual checks below.

## Passed

- **13 Node tests:** three-expression target ordering, neutral and irrelevant-feature handling, conflict/missing-feature penalties, missing/malformed tracking rejection, symmetric left/right handling, reference activation validation, smoothing reset, six-round flow, stale tracking, unstable hold, retry and reset.
- **7 browser tests in Google Chrome for Testing 155.0.8059.39 on this Windows environment** (five core tests, followed by two targeted recovery/layout tests): desktop/mobile rendering and operator controls; real local CPU and GPU model initialization and blank-frame/image inference; simulated six-round parent/child flow including retry, multi-face tracking loss, comparison and reset; actual browser camera-permission denial; one-face reference analysis, 52 blendshapes, two-face rejection, local persistence/reload and demo restoration; actual camera-to-worker CPU capture using a synthetic browser camera at 640 × 480, with no-face attempts rejected; forced GPU initialization failure with successful real CPU fallback; simulated missing-model recovery and responsive control placement.
- The first three browser smoke/flow checks also passed in the available installed Microsoft Edge browser. This is limited test evidence, not a promise of compatibility with every browser.
- **Offline-dependency test:** restarted the Node server, used new browser contexts with no prior cache, and blocked every non-loopback request in the browser tests. Local JS, model and WASM loaded, references were analysed, and the simulated complete game ran successfully. No participant images were used.
- **Assets:** all six required model/runtime files passed their SHA-256 checks.
- **Windows lifecycle:** launched with the real Windows PowerShell script; a second launch kept the same server process; Stop script stopped that process; a fresh launch succeeded. A direct second server start failed with the expected explicit port-conflict message. Browser opening was suppressed during this lifecycle check to avoid opening extra user tabs.
- Reviewed screenshots at 1440-pixel desktop width, 390-pixel mobile width and the family comparison screen. After spacing adjustments, browser assertions verified that main controls fit a 1366 × 768 laptop viewport and the mobile camera button clears the status message.

## What these results do not establish

- **No real webcam or live adults/children were used.** The capture test used Chrome's synthetic camera. Full game-flow tests used explicitly simulated measurements; the separate runtime/reference tests used the real MediaPipe model and a Google sample photograph. No live expression-scoring validation is claimed.
- **No i5-1240P/Iris Xe performance benchmark.** CPU and GPU execution succeeded, but first-frame model/driver warm-up is not a sustainable inference rate. The GPU smoke test in this environment had a slow cold first inference (about 5.6 seconds); CPU's blank first inference was about 103 ms. These are diagnostic observations on this test environment, not exhibition-laptop predictions. Inspect the actual laptop's measured rate; use CPU if GPU is slow. The 12 Hz target has not been established with people on that laptop.
- **No physical network disconnection was performed.** External requests were blocked for the fresh-context tests, but a fresh startup with the laptop's Wi-Fi/Ethernet physically disconnected is still required.
- **No 30-minute endurance run**, connected-TV/projector test, USB-camera switch test, or human fairness/comfort evaluation was completed. Typical family duration remains an estimate.
- Hardware camera-busy/disconnected conditions and physical fullscreen/display behaviour still need rehearsal. Clear recovery paths are implemented.
- The two selected human defaults have measured targets. Original illustrations remain explicit presets; pout still uses one because no supplied photo showed meaningful pucker movement. All references need live human tuning.

Complete `EXHIBITION-CHECKLIST.md` before the event. The game is implemented and automated checks pass; these remaining items are hands-on exhibition acceptance checks.

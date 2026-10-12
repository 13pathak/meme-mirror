# Test results — 12 October 2026

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

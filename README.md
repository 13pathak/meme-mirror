# Meme Mirror — Can You Make That Face? (a quick pet project)

A local browser game for the school PTM on **14 October 2026**. Child and parent copy the same three faces, hold each expression, then see a cheerful score comparison. A temporary picture celebrates each completed hold. No accounts, names, cloud inference, API keys, saved participant photos, or video recordings.

## First-time setup (internet needed once)

Install **Node.js 22 or newer** and **Google Chrome**. In PowerShell, open this project folder and run:

```powershell
cd 'C:\Hotmail\OneDrive\Extensions\Isolates\Meme Mirror'
npm.cmd ci
npm.cmd run setup
npm.cmd run check:assets
```

The supplied checkout already contains prepared model/runtime assets and installed dependencies. Setup is for a fresh copy or recovery. `npm ci` follows `package-lock.json`; it does not upgrade packages. `npm run setup` copies the exact JS/WASM runtime and downloads the version-1 model only if missing. `assets-lock.json` records SHA-256 checksums; model replacement must match the pinned checksum.

No build step is needed. The application is plain HTML, CSS and JavaScript, served by Node's built-in HTTP server. This keeps startup smaller than a development-tool chain. MediaPipe Tasks Vision **0.10.21** and test-only Playwright **1.56.1** are pinned. A newer MediaPipe release exists; this conservative pin was chosen and tested with the version-1 model instead of using an untested floating `latest` dependency.

## Normal exhibition startup (internet not needed)

1. Double-click **Start Meme Mirror.bat**.
2. Open **http://127.0.0.1:4173** in Chrome if it does not open automatically.
3. Click **Enable camera** and allow access. A built-in camera is the default.
4. Use **Fullscreen** or Chrome's **F11** key. Press F11/Escape to leave fullscreen.
5. Click **Start playing**. Each completed hold reveals your steady face beside the reference for **2.5 seconds**, with **Expression match** shown as a percentage below your picture. Then **Next face** becomes available. The child plays three rounds, followed by the parent using the same frozen references.
6. Use **Retry round** for another take, **Next** to accept the result, and **Reset family** / **Next family** to clear session scores. Reset keeps the webcam ready for the next family.

The reveal uses the exact inferred frame that completes the hold, mirrored to match the preview. The final score still averages the full hold. The picture exists only in a browser canvas: it is never encoded, downloaded, stored or uploaded. Its pixels are cleared after the reveal, on Reset, or when the page is hidden/closed. A reset button is available during the reveal. If a frame cannot be displayed, the round result and Next/Retry remain usable.

The launcher checks the local assets, binds only to `127.0.0.1`, starts a hidden local server, and prefers installed Chrome. It reuses an existing Meme Mirror server from this exact folder. If Chrome is absent, it opens the default browser and reports that Chrome is the target. Another app or another project copy on port 4173 causes an actionable error.

**Stopping:** close the camera tab (or Operator desk → Turn camera off), then double-click **Stop Meme Mirror.bat**. That launcher only stops its own recorded Node process after checking its command line. For a visible server terminal instead:

```powershell
npm.cmd start
```

Leave that terminal open and press **Ctrl+C** to stop it. A launcher reusing a manually started server leaves it under that terminal's control.

**Launch recovery:** inspect `server-error.log` and `server.log`. If port 4173 is busy, stop the other app or the prior Meme Mirror terminal; do not kill an unknown process. For missing assets, rerun setup while online. For a model checksum error, delete only `public/models/face_landmarker.task`, then rerun setup to download the pinned model. For a missing Node command, install Node and reopen the terminal. Do not use `file://` to open `index.html`.

## Quick camera feasibility check

Before inviting families, open **http://127.0.0.1:4173/feasibility.html**, or use the link in the Operator desk. Enable the camera and test a smile, raised eyebrows/open mouth, and pushed-forward lips. It shows real blendshape-derived measurements, face count, delegate, inference time, and observed update rate. Close that tab before playing to release its camera and model.

The game requests **640 × 480** video and schedules a target of **12 inferences/second**. The operator diagnostics show actual resolution, mean inference time, and measured output rate over the last three seconds. This is a target, not a verified exhibition-laptop benchmark. Interface rendering and camera preview remain separate from worker inference. Slow hardware lowers the rate; the application never builds a queue of camera frames.

## Operator desk

Open the **gear** at the top right. This pauses the round while keeping diagnostic measurements live. Reset the family before changing camera or references.

- **Camera:** select the built-in or USB webcam and click Reconnect camera. Camera labels populate after permission is granted.
- **Execution:** GPU preferred automatically falls back to CPU if GPU initialization or inference throws. Choose CPU only and reconnect if GPU is slow or unreliable. A worker crash/timeout reports a retry message. Hardware delegate selection resets on page reload.
- **No face:** move into view, face forward, improve light. **Two faces:** spectators step outside the camera view. Only exactly one detected face is accepted. A detector can still miss a partially visible face, so keep the playing area clear.
- **Permission denied:** allow camera in Chrome's address bar/site settings and retry. **Busy/unavailable:** close other camera apps or reconnect the USB camera.
- Model-loading errors prompt setup/reload/CPU recovery; Start stays disabled until the camera works.

## Add your human references

The three supplied SVG illustrations are **labelled demos with explicit preset targets**. They have **not** been analysed by MediaPipe. They provide a playable starting point while you obtain school-appropriate human reference photos.

1. Reset the family and open the gear.
2. Choose Smile, Surprise, or Pout and enter the caption.
3. Select a local JPG/PNG/WebP (under 12 MB), then **Analyse & save reference**.
4. The app resizes the photo to at most 1000 pixels, analyses it once using the same model, and requires exactly one detected face and meaningful primary expression movement. Invalid images do not replace the existing reference.
5. Repeat for all three slots. Use **Restore this demo** to undo a replacement.

Use front-facing, well-lit, visibly expressive human photos. Heavily distorted memes and cartoons may not yield useful measurements. A technically valid face does not guarantee a well-balanced game target; test it with several people.

Reference photos, captions, model version and extracted targets are stored in this browser profile's **localStorage** at the exact `127.0.0.1:4173` origin. These are operator assets, separate from participant video. Different profiles/ports/`localhost` spelling have separate storage. Clearing site data removes them. **Export reference pack** backs up photos and targets as JSON; save the file in `public/references/` or another local folder. **Import reference pack** restores a pack without re-running analysis; only import your own exported, verified packs. Import validates structure, numeric ranges and model version, not a tamper-proof proof of analysis. To verify an unfamiliar photo, upload it normally. Export packs can contain people’s images; keep them appropriately.

## What the AI does, and what the score means

Google's pretrained **MediaPipe Face Landmarker** estimates facial landmarks and 52 blendshape coefficients. This app uses only selected expression movements. It does not compare identity, face proportions, raw pixels, or infer the participant's real emotions. MediaPipe has no built-in “meme similarity percentage”. **Expression match** is our unvalidated **0–100 game scale**; the reveal formats it as a percentage for the game, not scientific accuracy. **100% held** means the hold duration is complete and is separate from the expression-match score.

Related left/right coefficients are averaged into features in `public/scoring.js`:

| Feature | Blendshapes |
|---|---|
| smile | mouthSmileLeft, mouthSmileRight |
| brow | browInnerUp, browOuterUpLeft, browOuterUpRight |
| wide | eyeWideLeft, eyeWideRight |
| jaw | jawOpen |
| pucker / funnel | mouthPucker / mouthFunnel |
| frown / press | paired mouthFrown / mouthPress |

The video preview is mirrored with CSS; inference receives the unmirrored frame. Bilateral averages make left/right handling consistent for photos and participants.

For active feature `i`, target `t_i`, measured value `x_i`, configured weight `w_i` and tolerance `τ`:

```text
active = relevant features with target >= 0.08 and weight > 0
E = weighted_mean(clamp(abs(x_i - t_i) / τ, 0, 1))
A = weighted_mean(clamp(x_i / t_i, 0, 1))
P = sum(conflict_weight_j * clamp(x_j - target_j - 0.12, 0, 1))
match = 100 * clamp((1 - E) * A - P, 0, 1)
```

Only expression-specific active movements earn points. Matching zeros in dozens of unrelated blendshapes earns nothing. `A` penalises absent target movement, and `P` penalises conflicting movements above the reference's own baseline plus a small deadband. Exact target movements score 100; a neutral face scores 0 for the presets. Low scores can still complete a round: holding steady is enough; no minimum score gate excludes participants.

Features are exponentially smoothed using a **180 ms** time constant. Each round has **3 seconds preparation**, **7 seconds experimentation**, then up to **6.5 seconds** to find a stable **1.8-second hold** with at least **10 samples** and a score range no larger than **18 points**. The final score is the rounded arithmetic mean of the held, smoothed sample scores. Stability refers to score variation, not proof that every facial muscle was motionless. It does not select the highest-scoring frame.

No-face, multi-face, malformed measurements, hidden tabs, and results older than **500 ms** clear the live score and hold buffer. Tracking loss pauses the attempt and eventually requests Retry after 15 seconds. Background tabs and the operator dialog pause round timers. Inference accepts up to two faces for rejection purposes, but scores only one; application smoothing replaces MediaPipe's one-face-only built-in smoothing.

Each player totals three scores, **out of 300**. Active time is about 71 seconds for six successful rounds, plus 15 seconds of photo reveals, instructions, results and handover: roughly **90–120 seconds per family** is the intended pace, still requiring a timed rehearsal.

### Tune after testing

Edit the `EXPRESSIONS` array in `public/scoring.js`, then reload Chrome:

| Expression | Preset targets | Relative weights | Tolerance | Conflicting movements |
|---|---|---|---|---|
| Smile | smile .80 | smile 1.0 | .65 | pucker .55, frown .50 |
| Surprise | brow .50, wide .40, jaw .55 | .35, .25, .40 | .60 | smile .40, pucker .35 |
| Pout | pucker .70, funnel .25 | .80, .20 | .60 | smile .55, jaw .45 |

Raise tolerance slightly if normal variation is too harsh. Adjust the strongest feature's target/weight using observations across adults and children; avoid calibrating around just one person. Saved human photos replace preset targets, while weights/tolerance still apply. Restore a demo to test changed preset targets. Hold/timer settings are in `public/game.js` (`TIMING`). No neutral calibration is required. Run the scoring tests after changing the formula or weights.

## Offline preparation and test

All runtime JavaScript, SIMD/non-SIMD WASM files, model weights, illustrations and styles live under `public/`. Fonts are installed system fonts, not web downloads. No CDN, cloud API or external asset is requested during play. The server's Content Security Policy restricts network connections to this origin. `npm start` and both launchers do not install anything. Once prepared, even `node_modules` is unnecessary for ordinary startup; keep it for setup and automated tests.

Because this folder is under OneDrive, mark the **entire project “Always keep on this device”**, or copy it to a fully local folder such as `C:\MemeMirror`. Keep `public/`, `scripts/`, `assets-lock.json`, and the launchers together. A new path still uses the same browser origin; export references before moving profiles/machines.

**Mandatory laptop rehearsal:** stop the server and close the browser, disconnect Wi-Fi/Ethernet, start using the launcher, reload the app, enable the camera, finish both turns, restart again and verify photos still appear. Do not rely on an already-loaded tab. Reconnect only after confirming the test. Automated tests here blocked all non-loopback browser requests with fresh contexts after a server restart; this is useful offline-dependency coverage, but it does not replace physically disconnecting the exhibition laptop.

## Tests and source map

```powershell
npm.cmd test
npm.cmd run check:assets
# In another terminal, with npm start already running and Chrome installed:
npm.cmd run test:browser
```

For a portable Chrome build, set `$env:CHROME_PATH` to its `chrome.exe` before the browser test command. `PW_CHANNEL=msedge` is available for a secondary smoke check. Test-only browser simulations never ship a fake scoring mode in the visitor app.

See **TEST-RESULTS.md** for executed checks and **EXHIBITION-CHECKLIST.md** for the remaining human/hardware rehearsal. Files:

- `public/feasibility.*`: minimal camera/measurement lab.
- `public/vision-worker.js`, `camera.js`: local model, fallback, single-frame scheduling and camera errors.
- `public/scoring.js`, `game.js`: tunable scoring and independent round state machine.
- `public/app.js`, `references.js`: visitor/operator interface and operator reference persistence.
- `public/reveal.js`: temporary mirrored hold-completion picture and its 2.5-second lifetime.
- `scripts/setup.mjs`, `check-assets.mjs`: local dependency/model preparation and checksums.
- `scripts/server.mjs`, `launch.ps1`, `stop.ps1`: loopback-only serving and Windows lifecycle.
- `tests/`: scoring/state tests, browser tests and a Google sample portrait used only in tests.

### Documentation checked

Official [Face Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), [package listing](https://www.npmjs.com/package/@mediapipe/tasks-vision), and [version-1 model](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task), checked 12 October 2026. The guide documents blendshape output, image/video modes, synchronous inference, subject-relative left/right names and smoothing restrictions. See `THIRD-PARTY-NOTICES.md` for asset provenance.

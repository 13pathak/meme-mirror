# Exhibition rehearsal — 14 October 2026

Do this on the actual i5-1240P / Iris Xe / 16 GB laptop before the PTM. Automated tests are not a substitute for these checks.

- [ ] Mark OneDrive files “Always keep on this device”, or copy the prepared project to a fully local folder.
- [ ] Run `npm.cmd run check:assets`. Launch twice; confirm it reuses the server. Stop and start again.
- [ ] Test the built-in camera and optional USB camera in Chrome. Try permission denial and recovery, camera unplug/reconnect, and another app holding the camera.
- [ ] Open the camera lab. Verify smile, brow/eye/jaw and pucker/funnel readings visibly respond. Check GPU and CPU; record actual update rate and latency with a face in view. Select whichever works best.
- [ ] Check at least several adults and children: different heights, glasses, ordinary lighting, and comfortable distance. Tilt/reposition the laptop or webcam so smaller participants can face it naturally.
- [ ] Tune expression weights/tolerances fairly across people. Pout may be less consistent; replace its photo or simplify its target if needed. Do not call the score scientific accuracy or emotion detection.
- [ ] Try the working human grin and original surprise demo with at least one adult and one child. If a target is awkward, reset and use Operator desk → Original illustrated demos → Use selected defaults for all three. Rehearse this fallback once.
- [ ] If using the new wink, laughing grin or scowl emojis, try each yourself and with a child before the exhibition. Choose the three most comfortable options in Choose memes; both players must receive the same selection.
- [ ] Add and verify the three human references if desired. Export the reference pack as a backup. Restart Chrome and confirm it persists.
- [ ] Check the success chime and family drumroll at a comfortable speaker volume. Verify header/replay mute, remembered mute after reload, and immediate silence on Reset.
- [ ] Connect the TV/projector/smartboard. Use F11, verify the full controls are visible, the caption and hold instructions are readable from the queue, and the camera preview is naturally mirrored. Use Chrome zoom-out if the laptop's display scaling clips the bottom controls.
- [ ] Finish both turns with the same references. Test Retry, Next, Reset during each phase, ties, low scores, and the final comparison. Try Skip meme during practice/hold and after a failure; it should record skipped (0), advance immediately without a success photo, and handle the third-round parent handover and final results. Time five families; the shorter hold aims for about 75–100 seconds each, including handover.
- [ ] Verify each completed hold replays the last moments of the correct player’s expression, mirrored, beside the match score for 2.5 seconds. Test Reset during the replay and confirm it clears immediately. Test retry, skip, tracking loss and the parent handover for any old frames. Check replay readability and smoothness on the exhibition laptop/display; reduced-motion settings should show the finishing frame instead.
- [ ] With several adults and children, test all selected memes: neutral faces, unrelated expressions and barely moving should not complete; comfortable recognizable versions should reach 55 and complete a one-second hold. Try weaker and stronger versions, glasses and ordinary lighting. Brief detection dips should pause rather than erase progress; sustained mismatches should reset it. After 10 seconds without a match, verify helpful guidance and Retry. Record any false passes or repeated failures before tuning; do not calibrate around just one person.
- [ ] Have a spectator enter the frame. Confirm “One face at a time” and no valid hold. Step out during the hold; confirm the score clears and the hold restarts.
- [ ] Open/close the operator desk and switch browser tabs mid-round; confirm the round resumes without a stale score.
- [ ] Run continuously for **at least 30 minutes** with repeated families and resets. Watch for stalls, memory growth, overheating, increased latency and camera interruptions. No forced refresh should be needed.
- [ ] **Fresh offline startup:** stop server, close Chrome, disconnect Wi-Fi/Ethernet, relaunch from the BAT, enable the camera and finish all six rounds. Restart again. Verify custom reference photos still work.
- [ ] Leave the laptop plugged in, disable sleep for the event, and mark one-player standing position with tape. Keep the playing area clear of spectators.

Record the rehearsal:

| Check | Observation |
|---|---|
| Chrome version / date | |
| Camera / actual resolution | |
| GPU measured Hz / ms | |
| CPU measured Hz / ms | |
| Display / zoom / viewing distance | |
| Typical family duration | |
| Adults/children tried / tuning changes | |
| 30-minute run result | |
| Fresh physically disconnected startup result | |

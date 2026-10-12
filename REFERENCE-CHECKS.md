# Supplied reference-photo checks — 12 October 2026

All four supplied photos were processed by the actual local Face Landmarker in **CPU and GPU** modes. Both modes detected **one face in every image**. Model: `face_landmarker/float16/1`; package: `@mediapipe/tasks-vision@0.10.21`.

The following CPU measurements are movement coefficients, not emotion labels or accuracy percentages. Targets in `public/builtin-references.js` store the full unrounded measurement vectors from photos 3 and 4.

| Supplied image | Smile | Raised brow | Eye wide | Jaw open | Lip pucker | Decision |
|---|---:|---:|---:|---:|---:|---|
| 1: tilted “wow” face | .134 | .725 | .106 | .403 | .002 | Usable alternative; not chosen because of the angled face and side-directed eyes. |
| 2: open-mouth reaction | .679 | .087 | .234 | .658 | .031 | Not chosen: the model reads a large smile and little brow raising, so this is an ambiguous surprise target. |
| 3: raised-brow grin | .411 | .644 | .200 | .177 | .007 | Selected for the holiday grin. Smile/brow weights .70/.30; an excessively open jaw is a conflict. |
| 4: frontal surprise | .168 | .495 | .094 | .755 | .004 | Selected for surprise. Brow/jaw weights .45/.45; weaker eye-wide output gets .10. |

GPU measurements showed the same useful movement pattern: photo 3 smile .390 / brow .667; photo 4 brow .479 / jaw .721. Neither selected reference depends on a one-off GPU-only detection.

**Pout stays illustrated.** None of the four supplied photos approaches the required .15 primary pucker activation, so none was accepted as a pout reference. The three original illustrated demos and their explicit preset targets remain available.

Select **Operator desk → Default faces → Original illustrated demos** for the original set. To remove saved slot overrides and apply that set to all three rounds, click **Use selected defaults for all three**. Choosing checked human defaults restores the two bundled photos plus the pout demo. Changing the setup requires resetting the family; both players use the same frozen references throughout a session.

The new automated checks compare each photo with its measured target, a neutral movement vector, and the other selected expression; they also run resized 640 × 480 video frames through the real model in CPU/GPU modes. A separate native canvas-to-video stream runs the selected photo through the real camera/worker/game/hold/reveal pipeline. These are static-image and synthetic-camera tests, not trials with real participants. They establish that the images and application pipeline work; comfortable imitation, lighting, camera position, and fair scores still need a short live rehearsal on the event laptop.

| Selected target | Same photo at camera resolution: CPU | Same photo at camera resolution: GPU | Neutral | Other selected expression |
|---|---:|---:|---:|---:|
| Grin | 98.9 | 90.8 | 0 | 16.4 |
| Surprise | 92.3 | 95.7 | 0 | 26.6 |

The full synthetic-camera rounds produced final averaged scores of **99 for grin** and **92 for surprise**, with the temporary photo reveals working. These scores show pipeline consistency for repeated reference-photo input; they are not expected scores for people or scientific accuracy claims.

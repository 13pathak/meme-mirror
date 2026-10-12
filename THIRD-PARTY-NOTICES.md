# Third-party provenance

- `@mediapipe/tasks-vision` **0.10.21**, Google MediaPipe, Apache-2.0 package license. Installed from npm with the integrity recorded in `package-lock.json`. Runtime copies are in `public/vendor/`; its original README is included there.
- Face Landmarker model **float16 / version 1**, distributed by Google at `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`. SHA-256: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`. See Google's model documentation/model card for intended uses and model distribution terms.
- `@playwright/test` **1.56.1**, Microsoft, Apache-2.0; development verification only.
- `tests/portrait.jpg`: Google's MediaPipe test asset from `https://storage.googleapis.com/mediapipe-assets/portrait.jpg`, downloaded 12 October 2026 solely as a test fixture. It is never served as a default visitor reference. Do not imply this person is a participant or that the school supplied this photo.
- `public/assets/*.svg`: original illustrative demo assets created for this application. Their targets are explicit presets, not model measurements of the drawings.
- `public/assets/memes/grin.png` and `surprise.png`: photos supplied by the user on 12 October 2026 (attachments 3 and 4). They were tested with the local model and bundled as operator reference assets, not participant captures. Their original third-party rights remain with their respective owners.
- System fonts only (Arial/Helvetica/sans-serif and Georgia/serif); no remote font files.

Portable Chrome for Testing in the ignored `.test-tools/` folder is a development-only Google browser distribution downloaded from its official Chrome for Testing manifest. It is not required or bundled into the application runtime.

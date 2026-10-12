import { mkdir, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = path.join(root, 'node_modules/@mediapipe/tasks-vision');
const out = path.join(root, 'public/vendor');
await mkdir(path.join(out, 'wasm'), { recursive: true });
await mkdir(path.join(root, 'public/models'), { recursive: true });
await copyFile(path.join(pkg, 'vision_bundle.mjs'), path.join(out, 'vision_bundle.mjs'));
for (const name of await readdir(path.join(pkg, 'wasm'))) {
  await copyFile(path.join(pkg, 'wasm', name), path.join(out, 'wasm', name));
}
await copyFile(path.join(pkg, 'README.md'), path.join(out, 'MEDIAPIPE-README.md'));
const model = path.join(root, 'public/models/face_landmarker.task');
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
let bytes;
try { bytes = await readFile(model); } catch {
  console.log('Downloading Face Landmarker float16 model version 1 (one time)…');
  const response = await fetch(modelUrl, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Model download failed: HTTP ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
}
if (bytes.length < 1000000 || bytes[0] !== 0x00 && bytes[0] !== 0x50) {
  throw new Error('Unexpected model file. Remove public/models/face_landmarker.task and retry setup.');
}
const sha256 = data => createHash('sha256').update(data).digest('hex');
const modelHash = sha256(bytes);
let previous;
try { previous = JSON.parse(await readFile(path.join(root, 'assets-lock.json'), 'utf8')); } catch {}
if (previous && previous.modelSha256 !== modelHash) throw new Error('Model checksum differs from assets-lock.json. Do not use this model.');
await writeFile(model, bytes);
const files = ['models/face_landmarker.task', 'vendor/vision_bundle.mjs', ...(await readdir(path.join(out, 'wasm'))).map(n => `vendor/wasm/${n}`), 'assets/memes/grin.png', 'assets/memes/surprise.png'];
const hashes = {};
for (const file of files) hashes[file] = sha256(await readFile(path.join(root, 'public', file)));
await writeFile(path.join(root, 'assets-lock.json'), JSON.stringify({ package: '@mediapipe/tasks-vision@0.10.21', modelUrl, modelSha256: modelHash, hashes }, null, 2) + '\n');
console.log('Local assets ready. Run npm start. Future starts need no internet.');

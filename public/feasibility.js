import { VisionCamera } from './camera.js';
const status = document.querySelector('#status');
let last;
const camera = new VisionCamera(document.querySelector('video'), result => {
  const rate = last ? 1000 / (result.received - last) : 0; last = result.received;
  document.querySelector('#readings').textContent = JSON.stringify({ faces: result.count, delegate: result.delegate, inferenceMs: result.ms?.toFixed(1), observedHz: rate.toFixed(1), movements: result.sample }, null, 2);
  status.textContent = result.count === 1 ? 'One face found. Try the three expressions.' : result.count > 1 ? 'One player at a time, please.' : 'Step into view and face the camera.';
}, message => status.textContent = message);
document.querySelector('#enable').onclick = async () => { try { await camera.start(); } catch (e) { status.textContent = e.message; } };
window.addEventListener('pagehide', () => camera.dispose());

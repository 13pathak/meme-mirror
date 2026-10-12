import { measurements } from './scoring.js';
export function cameraMessage(error) {
  return ({ NotAllowedError: 'Camera permission is off. Allow camera access in Chrome’s address bar, then retry.', NotFoundError: 'No camera found. Connect a webcam, then retry.', NotReadableError: 'Camera is busy. Close other camera apps, then retry.', OverconstrainedError: 'That camera is unavailable. Choose another camera and retry.' })[error.name] || 'Could not start the camera. Reconnect it and retry.';
}
export class VisionCamera {
  constructor(video, onSample, onStatus) {
    this.video = video; this.onSample = onSample; this.onStatus = onStatus; this.pending = new Map(); this.id = 0; this.busy = false; this.ready = false; this.paused = false; this.lastVideo = -1;
  }
  async request(type, payload = {}, transfers = []) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('Local model timed out. Reload or select CPU and reconnect.')); }, type === 'init' ? 60000 : 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type, ...payload }, transfers);
    });
  }
  async init(delegate = 'GPU') {
    this.onStatus('Loading the local face model…');
    this.worker = new Worker('/vision-worker.js');
    this.worker.onmessage = ({ data }) => {
      const pending = this.pending.get(data.id); if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(data.id);
      data.error ? pending.reject(new Error(data.error)) : pending.resolve(data);
    };
    this.worker.onerror = () => { for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('Local model failed to load. Run npm run setup, then reload.')); } this.pending.clear(); };
    const result = await this.request('init', { delegate }); this.delegate = result.delegate; this.ready = true;
  }
  async start(deviceId = '', delegate = 'GPU') {
    this.stop(); this.lastVideo = -1;
    try {
      if (!this.ready) await this.init(delegate);
      this.onStatus('Allow the camera to join the fun.');
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 }, ...(deviceId ? { deviceId: { exact: deviceId } } : {}) } });
      this.stream.getVideoTracks()[0].onended = () => { this.stop(); this.onStatus('Camera disconnected. Reconnect it and retry.'); };
      this.video.srcObject = this.stream; await this.video.play();
      this.running = true; this.loop(this.generation); return await this.devices();
    } catch (error) { this.stop(); if (!this.ready) { this.dispose(); throw new Error('Local model could not load. Run npm run setup, or choose CPU and reconnect. ' + error.message); } throw new Error(cameraMessage(error)); }
  }
  async devices() { return (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput'); }
  async loop(generation) {
    if (!this.running || generation !== this.generation) return;
    const started = performance.now();
    if (!this.busy && !this.paused && !document.hidden && this.video.readyState >= 2 && this.video.currentTime !== this.lastVideo) {
      this.busy = true; this.lastVideo = this.video.currentTime;
      try {
        const bitmap = await createImageBitmap(this.video);
        const result = await this.request('frame', { bitmap, time: started }, [bitmap]);
        if (this.running && generation === this.generation && !this.paused && !document.hidden) {
          this.delegate = result.delegate;
          this.onSample({ ...result, sample: measurements(result.categories), captured: started, received: performance.now() });
        }
      } catch (error) { if (generation === this.generation) { this.stop(); this.ready = false; this.onStatus('Face tracking stopped. Use Enable camera to retry. ' + error.message); } }
      finally { this.busy = false; }
    }
    if (this.running && generation === this.generation) this.timer = setTimeout(() => this.loop(generation), Math.max(0, 83 - (performance.now() - started)));
  }
  async analyse(file, delegate = 'GPU') {
    this.paused = true;
    try {
      if (!this.ready) await this.init(delegate);
      // Wait for the sole current request; never enqueue live frames behind image analysis.
      while (this.busy) await new Promise(resolve => setTimeout(resolve, 20));
      const bitmap = await createImageBitmap(file);
      const result = await this.request('reference', { bitmap }, [bitmap]);
      return { ...result, sample: measurements(result.categories) };
    } finally { this.paused = false; this.onSample({ count: 0, sample: null, captured: performance.now(), received: performance.now() }); }
  }
  stop() { this.generation = (this.generation || 0) + 1; this.running = false; clearTimeout(this.timer); this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.video.srcObject = null; this.onSample({ count: 0, sample: null, captured: performance.now(), received: performance.now() }); }
  dispose() { this.stop(); this.worker?.terminate(); for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('Camera was restarted.')); } this.pending.clear(); this.ready = false; }
}

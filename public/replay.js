export const REPLAY_MS = 2500;
export const MAX_REPLAY_FRAMES = 32;

export function clearFrames(frames) {
  for (const { canvas } of frames) { canvas.width = 0; canvas.height = 0; }
  frames.length = 0;
}

// A bounded in-memory sequence of inferred frames. No encoding or persistent storage.
export class ReplayBuffer {
  constructor() { this.frames = []; }
  capture(bitmap, time) {
    if (!bitmap?.width || !bitmap?.height || !Number.isFinite(time)) return;
    if (this.frames.length && time <= this.frames.at(-1).time) return;
    let canvas;
    while (this.frames.length && (this.frames[0].time < time - REPLAY_MS || this.frames.length >= MAX_REPLAY_FRAMES)) {
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      canvas = this.frames.shift().canvas;
    }
    canvas ||= document.createElement('canvas');
    try {
      const scale = Math.min(1, 640 / bitmap.width, 480 / bitmap.height);
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      this.frames.push({ canvas, time });
    } catch {
      // A missing replay frame must never interrupt scoring or camera tracking.
      canvas.width = 0; canvas.height = 0;
    }
  }
  take() { const frames = this.frames; this.frames = []; return frames; }
  clear() { clearFrames(this.frames); }
}

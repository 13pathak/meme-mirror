import { REPLAY_MS, clearFrames } from './replay.js';
export const REVEAL_MS = REPLAY_MS;

// A short-lived canvas only: no encoding, download, storage, or upload of camera images.
export class RoundReveal {
  constructor(dialog, onClose) {
    this.dialog = dialog;
    this.canvas = dialog.querySelector('canvas');
    this.onClose = onClose;
    this.frames = [];
    this.confetti = document.createElement('div');
    this.confetti.className = 'reveal-confetti';
    this.confetti.setAttribute('aria-hidden', 'true');
    dialog.append(this.confetti);
    dialog.addEventListener('close', () => {
      // An older queued close event must not clear a newer reveal.
      if (!dialog.open) this.clear();
    });
  }
  show(frames, reference, score) {
    this.hide();
    this.frames = frames;
    if (!frames.length) return false;
    try {
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animated = !reducedMotion && frames.length > 1;
      this.draw(animated ? frames[0] : frames.at(-1));
      this.dialog.querySelector('#reveal-kind').textContent = animated ? 'YOUR INSTANT REPLAY' : 'YOUR MATCH';
      this.dialog.querySelector('#reveal-reference').src = reference.image || `/assets/${reference.id}.svg`;
      this.dialog.querySelector('#reveal-caption').textContent = `“${reference.caption}”`;
      this.dialog.querySelector('#reveal-score').textContent = `${score}%`;
      this.dialog.showModal();
      if (animated) {
        const started = performance.now();
        let index = 0;
        const play = now => {
          if (!this.dialog.open || !this.frames.length) return;
          const previous = index;
          while (index + 1 < frames.length && frames[index + 1].time - frames[0].time <= now - started) index++;
          if (index !== previous) this.draw(frames[index]);
          if (index + 1 < frames.length) this.animation = requestAnimationFrame(play);
        };
        this.animation = requestAnimationFrame(play);
      }
      this.burst();
      this.timer = setTimeout(() => this.hide(), REVEAL_MS);
      return true;
    } catch {
      // The scored result remains usable if a frame or canvas is unavailable.
      this.hide();
      return false;
    }
  }
  draw(frame) {
    if (this.canvas.width !== frame.canvas.width) this.canvas.width = frame.canvas.width;
    if (this.canvas.height !== frame.canvas.height) this.canvas.height = frame.canvas.height;
    this.canvas.getContext('2d').drawImage(frame.canvas, 0, 0);
  }
  burst() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#aaca70', '#f4c542', '#ee8c9c', '#6ba4d2', '#eea25c'];
    const pieces = document.createDocumentFragment();
    for (let i = 0; i < 48; i++) {
      const piece = document.createElement('i');
      const left = i % 2 === 0;
      piece.style.left = left ? '0' : '100%';
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.setProperty('--drift', `${(left ? 1 : -1) * (15 + Math.random() * 65)}vw`);
      piece.style.setProperty('--lift', `${-(15 + Math.random() * 35)}vh`);
      piece.style.setProperty('--spin', `${(Math.random() - .5) * 1080}deg`);
      piece.style.animationDelay = `${Math.random() * 120}ms`;
      if (i % 3 === 0) piece.style.borderRadius = '50%';
      pieces.append(piece);
    }
    this.confetti.replaceChildren(pieces);
    this.confettiTimer = setTimeout(() => this.confetti.replaceChildren(), 1800);
  }
  clear() {
    clearTimeout(this.timer);
    cancelAnimationFrame(this.animation);
    clearFrames(this.frames);
    clearTimeout(this.confettiTimer);
    this.confetti.replaceChildren();
    // Resetting dimensions discards all participant pixels and drawing state.
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.dialog.querySelector('#reveal-reference').removeAttribute('src');
    this.onClose?.();
  }
  hide() {
    if (this.dialog.open) this.dialog.close();
    this.clear();
  }
}

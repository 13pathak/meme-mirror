export const REVEAL_MS = 2500;

// A short-lived canvas only: no encoding, download, storage, or upload of camera images.
export class RoundReveal {
  constructor(dialog, onClose) {
    this.dialog = dialog;
    this.canvas = dialog.querySelector('canvas');
    this.onClose = onClose;
    this.confetti = document.createElement('div');
    this.confetti.className = 'reveal-confetti';
    this.confetti.setAttribute('aria-hidden', 'true');
    dialog.append(this.confetti);
    dialog.addEventListener('close', () => {
      // An older queued close event must not clear a newer reveal.
      if (!dialog.open) this.clear();
    });
  }
  show(bitmap, reference, score) {
    this.hide();
    if (!bitmap?.width || !bitmap?.height) return false;
    try {
      this.canvas.width = bitmap.width;
      this.canvas.height = bitmap.height;
      const ctx = this.canvas.getContext('2d');
      ctx.translate(bitmap.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(bitmap, 0, 0);
      this.dialog.querySelector('#reveal-reference').src = reference.image || `/assets/${reference.id}.svg`;
      this.dialog.querySelector('#reveal-caption').textContent = `“${reference.caption}”`;
      this.dialog.querySelector('#reveal-score').textContent = `${score}%`;
      this.dialog.showModal();
      this.burst();
      this.timer = setTimeout(() => this.hide(), REVEAL_MS);
      return true;
    } catch {
      // The scored result remains usable if a frame or canvas is unavailable.
      this.hide();
      return false;
    }
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

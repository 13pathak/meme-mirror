export const REVEAL_MS = 2500;

// A short-lived canvas only: no encoding, download, storage, or upload of camera images.
export class RoundReveal {
  constructor(dialog, onClose) {
    this.dialog = dialog;
    this.canvas = dialog.querySelector('canvas');
    this.onClose = onClose;
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
      this.timer = setTimeout(() => this.hide(), REVEAL_MS);
      return true;
    } catch {
      // The scored result remains usable if a frame or canvas is unavailable.
      this.hide();
      return false;
    }
  }
  clear() {
    clearTimeout(this.timer);
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

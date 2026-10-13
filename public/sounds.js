export const FINALE_MS = 900;
const SOUND_KEY = 'meme-mirror-sound-v1';

// Small, locally synthesised effects; no audio files, network or microphone input.
export class SoundEffects {
  constructor() {
    this.enabled = true; this.voices = new Set();
    try { this.enabled = localStorage.getItem(SOUND_KEY) !== 'off'; } catch {}
  }
  unlock() {
    if (!this.enabled || document.hidden) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = .22;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    } catch { /* Sound must never prevent the game from running. */ }
  }
  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem(SOUND_KEY, this.enabled ? 'on' : 'off'); } catch {}
    if (this.enabled) this.unlock(); else this.stop();
  }
  voice(source, start, duration, volume, filter) {
    const gain = this.context.createGain();
    if (filter) { source.connect(filter); filter.connect(gain); } else source.connect(gain);
    gain.connect(this.master);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    const voice = { source, gain, filter };
    source.onended = () => { source.disconnect(); gain.disconnect(); filter?.disconnect(); this.voices.delete(voice); };
    this.voices.add(voice);
    source.start(start); source.stop(start + duration + .01);
  }
  tone(frequency, start, duration, volume) {
    const oscillator = this.context.createOscillator();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    this.voice(oscillator, start, duration, volume);
  }
  play(kind) {
    if (!this.enabled || document.hidden || this.context?.state !== 'running') return false;
    this.stop();
    try {
      const start = this.context.currentTime + .01;
      if (kind === 'success') {
        [659.25, 880, 1318.51].forEach((note,i) => this.tone(note, start + i * .1, .38, .3));
      } else if (kind === 'finale') {
        if (!this.noise) {
          this.noise = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * .09), this.context.sampleRate);
          const data = this.noise.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        for (let i = 0; i < 12; i++) {
          const hit = this.context.createBufferSource(); hit.buffer = this.noise;
          const filter = this.context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1600; filter.Q.value = .7;
          this.voice(hit, start + .72 * (1 - (1 - i / 12) ** 1.5), .07, .3 + i * .015, filter);
        }
        [523.25, 783.99].forEach(note => this.tone(note, start + .76, .32, .25));
      }
      return true;
    } catch { this.stop(); return false; }
  }
  stop() {
    for (const { source, gain, filter } of this.voices) {
      try { source.stop(); } catch {}
      source.disconnect(); gain.disconnect(); filter?.disconnect();
    }
    this.voices.clear();
  }
}

// src/lib/sound.ts
// Audio alert bel pesanan baru sintetis menggunakan Web Audio API

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioContext) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioContext = new AudioContextClass();
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Panggil pada interaksi pertama (click / touch) pada halaman kasir
 * agar browser mengizinkan pemutaran audio otomatis tanpa terblokir.
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Putar suara lonceng kasir "ding-dong" berkualitas tinggi
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playBellNotes(ctx)).catch(() => {});
    } else {
      playBellNotes(ctx);
    }
  } catch (err) {
    console.warn('Audio alert playback error:', err);
  }
}

function playBellNotes(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Nada 1: C5 (523.25 Hz) - Nada Ding Awal
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now);
  gain1.gain.setValueAtTime(0.35, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.4);

  // Nada 2: G5 (783.99 Hz) - Nada Dong Tinggi Bergema
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(783.99, now + 0.14);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0.4, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.14);
  osc2.stop(now + 0.85);
}

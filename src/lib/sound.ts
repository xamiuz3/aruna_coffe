// src/lib/sound.ts
// Sistem Audio Alert Bel Pesanan Kasir (Dual Engine: HTML5 Audio + Web Audio API Sintetis)

let sharedAudioContext: AudioContext | null = null;
let htmlAudioElement: HTMLAudioElement | null = null;
let isUnlocked = false;

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

function getHtmlAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!htmlAudioElement) {
      htmlAudioElement = new Audio('/bell.wav');
      htmlAudioElement.volume = 1.0;
      htmlAudioElement.preload = 'auto';
    }
    return htmlAudioElement;
  } catch {
    return null;
  }
}

/**
 * Panggil pada interaksi pertama (click / touch) pada halaman kasir
 * agar browser mengizinkan pemutaran audio otomatis tanpa terblokir autoplay policy.
 */
export function unlockAudioContext(): void {
  isUnlocked = true;
  
  // 1. Resume Web Audio API
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  // 2. Pre-warm HTML5 Audio
  const audio = getHtmlAudio();
  if (audio) {
    audio.load();
  }
}

export function isAudioReady(): boolean {
  return isUnlocked;
}

/**
 * Putar suara lonceng kasir "ding-dong" berkekuatan tinggi
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  let played = false;

  // Jalur 1: HTML5 Audio element (/bell.wav)
  try {
    const audio = getHtmlAudio();
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            played = true;
          })
          .catch((err) => {
            console.warn('HTML5 Audio play blocked or deferred:', err);
          });
      }
    }
  } catch (err) {
    console.warn('HTML5 Audio error:', err);
  }

  // Jalur 2: Web Audio API Oscillator (Dual redundansi instan)
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume()
          .then(() => playBellNotes(ctx))
          .catch(() => {});
      } else {
        playBellNotes(ctx);
      }
    }
  } catch (err) {
    console.warn('Web Audio alert playback error:', err);
  }
}

function playBellNotes(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;

    // Nada 1: Ding (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Nada 2: Dong Bergema (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.16);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.6, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.95);
  } catch (err) {
    console.warn('Oscillator error:', err);
  }
}


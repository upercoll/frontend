/**
 * Panel notification sounds.
 *
 * Everything is synthesised with the Web Audio API — no audio files to ship,
 * no decode latency, and it works offline.
 *
 * Autoplay policy: a browser will not let audio start until the user has
 * interacted with the page. `primeAudio()` is called from the first real
 * interaction so the very first notification is already audible.
 */

const STORAGE_KEY = "rbstars_panel_sounds";
const PRIMED_KEY = "rbstars_panel_sounds_primed";

type Listener = (on: boolean) => void;
const listeners = new Set<Listener>();

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  try {
    if (ctx) return ctx;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/* ── preference ──────────────────────────────────────────────────────── */

export function areSoundsEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundsEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* private mode — keep the in-memory value */
  }
  listeners.forEach((l) => l(on));
  if (on) primeAudio();
}

export function onSoundsChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ── priming ─────────────────────────────────────────────────────────── */

let primed = false;

/** Unlock audio on the first user gesture. Safe to call repeatedly. */
export function primeAudio() {
  if (primed) return;
  primed = true;
  try {
    if (localStorage.getItem(PRIMED_KEY) === "1") {
      // Previously unlocked in this browser profile — just resume quietly.
      const c = audioCtx();
      if (c && c.state === "suspended") c.resume().catch(() => {});
      return;
    }
    const unlock = () => {
      const c = audioCtx();
      if (!c) return;
      if (c.state === "suspended") c.resume().catch(() => {});
      try {
        localStorage.setItem(PRIMED_KEY, "1");
      } catch {}
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  } catch {}
}

/* ── tone primitives ─────────────────────────────────────────────────── */

type Tone = {
  freq: number;
  /** seconds from the start of the sound */
  at?: number;
  duration?: number;
  volume?: number;
  /** exponential glide target — gives the chime its "ping" */
  glideTo?: number;
  type?: OscillatorType;
};

function play(tones: Tone[]) {
  if (!areSoundsEnabled()) return;
  const c = audioCtx();
  if (!c) return;
  // Autoplay can still block a context that was never interacted with.
  if (c.state === "suspended") {
    c.resume().catch(() => {});
    return;
  }

  const t0 = c.currentTime;
  tones.forEach((tone) => {
    const at = t0 + (tone.at ?? 0);
    const dur = tone.duration ?? 0.22;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, at);
    if (tone.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(tone.glideTo, at + dur);
    }
    // Short attack, exponential tail — reads as a "chime" rather than a beep.
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(tone.volume ?? 0.18, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  });
}

/* ── the sounds ──────────────────────────────────────────────────────── */

/**
 * New paid order — a bright rising three-note chime. Deliberately distinct
 * from the claim/chat sounds so an order never gets mistaken for a message.
 */
export function playOrderSound() {
  play([
    { freq: 784.0, at: 0.0, duration: 0.2, volume: 0.2, type: "triangle" },  // G5
    { freq: 1046.5, at: 0.11, duration: 0.22, volume: 0.19, type: "triangle" }, // C6
    { freq: 1318.5, at: 0.22, duration: 0.42, volume: 0.18, type: "triangle", glideTo: 1567.98 }, // E6 → G6
  ]);
}

/** New claim request in the queue. */
export function playClaimSound() {
  play([
    { freq: 880.0, at: 0.0, duration: 0.3, volume: 0.28 },
    { freq: 1108.7, at: 0.12, duration: 0.28, volume: 0.22 },
    { freq: 1318.5, at: 0.24, duration: 0.45, volume: 0.18 },
  ]);
}

/** Someone typed in a chat you're viewing. */
export function playMessageSound() {
  play([{ freq: 1100, duration: 0.15, volume: 0.2, glideTo: 1320 }]);
}
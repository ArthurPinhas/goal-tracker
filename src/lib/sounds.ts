import { playUiSampleAccent, preloadUiSamples } from "@/lib/soundSamples";
import type { UiSoundKey } from "@/lib/soundSamples";

const STORAGE_KEY = "sounds-enabled";

/**
 * Kenney WAV blend layered *under* procedural audio (0 = off — punchiest / what shipped before samples).
 * Try 0.18–0.27 if you want subtle real-world texture without dulling the synth impact.
 */
const SAMPLE_BLEND = 0;

export const isSoundEnabled = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};
export const toggleSound = (): boolean => {
  const next = !isSoundEnabled();
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
};

let _ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  try {
    if (!_ctx)
      _ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
};

/** When > 0, Kenney WAVs are preloaded for optional accent. */
export const PRELOAD_UI_SAMPLES = SAMPLE_BLEND > 0;

/** Decode CC0 UI WAVs from `/public/sounds` into memory (skipped when SAMPLE_BLEND is 0). */
export function preloadUiSoundSamples(): void {
  if (!PRELOAD_UI_SAMPLES) return;
  const c = getCtx();
  if (!c) return;
  preloadUiSamples(c);
}

function maybeSampleAccent(c: AudioContext, master: AudioNode, key: UiSoundKey): void {
  if (SAMPLE_BLEND <= 0) return;
  preloadUiSamples(c);
  playUiSampleAccent(c, master, key, SAMPLE_BLEND);
}

/** Mild saturation before dynamics */
const makeSoftClipper = (c: AudioContext): WaveShaperNode => {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n / 2) - 1;
    curve[i] = Math.tanh(x * 2.35) * 0.9;
  }
  const w = c.createWaveShaper();
  w.curve = curve;
  w.oversample = "4x";
  return w;
};

/** Dry bus — fast attack lets transients hit before compression */
type PunchProfile = "celebrate" | "standard" | "tight";

const createMasterIn = (c: AudioContext, profile: PunchProfile): AudioNode => {
  const clip = makeSoftClipper(c);
  const comp = c.createDynamicsCompressor();
  comp.knee.value = 8;
  comp.ratio.value = 5;
  if (profile === "celebrate") {
    comp.threshold.value = -14;
    comp.attack.value = 0.003;
    comp.release.value = 0.22;
  } else if (profile === "tight") {
    comp.threshold.value = -11;
    comp.attack.value = 0.002;
    comp.release.value = 0.12;
  } else {
    comp.threshold.value = -12;
    comp.attack.value = 0.003;
    comp.release.value = 0.16;
  }
  comp.connect(c.destination);
  clip.connect(comp);
  return clip;
};

const makeReverb = (c: AudioContext, duration: number, decay: number): ConvolverNode => {
  const conv = c.createConvolver();
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  conv.buffer = buf;
  return conv;
};

/** Longer, softer IR — airy “finish” behind the fanfare */
const makeFanfareReverb = (c: AudioContext): ConvolverNode => makeReverb(c, 2.05, 1.95);

type OscDef = {
  freq: number;
  type?: OscillatorType;
  gain: number;
  freqEnd?: number;
  pan?: number;
};

const playOscGroup = (
  c: AudioContext,
  dest: AudioNode,
  oscs: OscDef[],
  startTime: number,
  attack: number,
  decay: number,
) => {
  oscs.forEach(({ freq, type = "sine", gain, freqEnd, pan }) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    if (pan !== undefined) {
      const p = c.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      p.connect(dest);
    } else {
      g.connect(dest);
    }
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd !== undefined)
      osc.frequency.linearRampToValueAtTime(freqEnd, startTime + attack + 0.05);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain, startTime + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);
    osc.start(startTime);
    osc.stop(startTime + decay + 0.06);
  });
};

const playNoiseBurst = (
  c: AudioContext,
  dest: AudioNode,
  startTime: number,
  duration: number,
  peakGain: number,
  centerFreq: number,
  q = 4,
) => {
  const len = Math.max(64, Math.floor(c.sampleRate * duration));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = centerFreq;
  bp.Q.value = q;
  const g = c.createGain();
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(peakGain, startTime + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  src.start(startTime);
  src.stop(startTime + duration + 0.04);
};

// ─── Subtask complete — full procedural + optional sample tuck ───────────────
export const playSubtaskDone = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const master = createMasterIn(c, "standard");
  const t = c.currentTime;

  playNoiseBurst(c, master, t, 0.048, 0.26, 2650, 5.5);

  playOscGroup(
    c,
    master,
    [
      { freq: 880, gain: 0.14, type: "triangle", pan: -0.28 },
      { freq: 880, gain: 0.12, type: "sine", pan: -0.28 },
      { freq: 1320, gain: 0.1, type: "sine", pan: 0.15 },
      { freq: 1760, gain: 0.072, type: "sine", pan: 0.38 },
      { freq: 2200, gain: 0.042, type: "sine", pan: 0 },
    ],
    t,
    0.004,
    0.36,
  );

  playOscGroup(
    c,
    master,
    [
      { freq: 128, gain: 0.18, type: "sine", freqEnd: 68, pan: 0 },
      { freq: 58, gain: 0.11, type: "triangle", freqEnd: 46, pan: -0.12 },
    ],
    t,
    0.002,
    0.15,
  );

  maybeSampleAccent(c, master, "subtask");
};

// ─── Goal complete — full procedural fanfare + optional sample tuck ──────────
export const playGoalDone = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const master = createMasterIn(c, "celebrate");
  const t = c.currentTime;

  const fanVerb = makeFanfareReverb(c);
  fanVerb.connect(master);

  playNoiseBurst(c, master, t, 0.052, 0.11, 2200, 4.2);
  playNoiseBurst(c, master, t + 0.024, 0.036, 0.075, 520, 2);

  playOscGroup(
    c,
    master,
    [
      { freq: 65.41, gain: 0.13, type: "sine" },
      { freq: 130.81, gain: 0.1, type: "triangle" },
      { freq: 98.0, gain: 0.048, type: "sine" },
    ],
    t,
    0.04,
    2.65,
  );

  const chord = [
    { freq: 261.6, delay: 0 },
    { freq: 329.6, delay: 0.065 },
    { freq: 392.0, delay: 0.13 },
    { freq: 523.3, delay: 0.195 },
    { freq: 659.3, delay: 0.26 },
  ];

  chord.forEach(({ freq, delay }, i) => {
    const start = t + delay;
    const pan = i % 2 === 0 ? -0.42 : 0.42;

    playOscGroup(
      c,
      fanVerb,
      [
        { freq, gain: 0.22, type: "sine" },
        { freq: freq * 2, gain: 0.085, type: "sine" },
        { freq: freq * 3, gain: 0.032, type: "triangle" },
      ],
      start,
      0.028,
      2.05,
    );

    playOscGroup(
      c,
      master,
      [
        { freq, gain: 0.095, type: "sine", pan },
        { freq: freq * 2, gain: 0.038, type: "triangle", pan: pan * 0.55 },
      ],
      start,
      0.014,
      0.78,
    );
  });

  playOscGroup(
    c,
    fanVerb,
    [
      { freq: 1318.5, gain: 0.1, type: "sine", pan: -0.28 },
      { freq: 1760, gain: 0.068, type: "sine", pan: 0.28 },
      { freq: 2093, gain: 0.045, type: "sine", pan: 0 },
      { freq: 2638, gain: 0.028, type: "sine", pan: 0.15 },
    ],
    t + 0.33,
    0.045,
    1.95,
  );

  maybeSampleAccent(c, master, "goal");
};

// ─── Emoji picked ───────────────────────────────────────────────────────────
export const playEmojiSpark = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const master = createMasterIn(c, "standard");
  const t = c.currentTime;

  playNoiseBurst(c, master, t, 0.024, 0.07, 3200, 6);

  playOscGroup(
    c,
    master,
    [
      { freq: 990, gain: 0.115, type: "triangle", freqEnd: 1320, pan: -0.2 },
      { freq: 1320, gain: 0.058, type: "sine", freqEnd: 1760, pan: 0.22 },
      { freq: 1980, gain: 0.035, type: "sine", freqEnd: 2340, pan: 0 },
    ],
    t,
    0.003,
    0.09,
  );

  maybeSampleAccent(c, master, "emoji");
};

// ─── Add goal/subtask ────────────────────────────────────────────────────────
export const playPop = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const master = createMasterIn(c, "tight");
  const t = c.currentTime;

  playNoiseBurst(c, master, t, 0.038, 0.14, 820, 2.2);

  playOscGroup(
    c,
    master,
    [
      { freq: 420, gain: 0.075, type: "triangle", freqEnd: 620, pan: -0.18 },
      { freq: 520, gain: 0.15, type: "sine", freqEnd: 800, pan: 0 },
      { freq: 780, gain: 0.082, type: "triangle", freqEnd: 1080, pan: 0.2 },
    ],
    t,
    0.007,
    0.22,
  );

  maybeSampleAccent(c, master, "pop");
};

// ─── Delete ─────────────────────────────────────────────────────────────────
export const playRemove = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const master = createMasterIn(c, "tight");
  const t = c.currentTime;

  playNoiseBurst(c, master, t, 0.032, 0.095, 520, 1.5);

  playOscGroup(
    c,
    master,
    [
      { freq: 420, gain: 0.095, type: "triangle", freqEnd: 260, pan: -0.15 },
      { freq: 500, gain: 0.115, type: "sine", freqEnd: 280, pan: 0.12 },
      { freq: 320, gain: 0.048, type: "sine", freqEnd: 180, pan: 0 },
    ],
    t,
    0.005,
    0.22,
  );

  maybeSampleAccent(c, master, "remove");
};

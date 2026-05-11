import { playUiSample, preloadUiSamples } from "@/lib/soundSamples";

const STORAGE_KEY = "sounds-enabled";

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

/** Decode CC0 UI WAVs from `/public/sounds` into memory (safe no-op if missing). */
export function preloadUiSoundSamples(): void {
  const c = getCtx();
  if (!c) return;
  preloadUiSamples(c);
}

/** Master FX flavour — wetter / longer for wins; dry / fast for utility clicks */
type FxProfile = "celebrate" | "standard" | "tight";

type FxPreset = {
  dry: number;
  wetSend: number;
  wetHpHz: number;
  delayS: number;
  fb: number;
  fbLpHz: number;
  revWet: number;
  irDur: number;
  irDecay: number;
  makeup: number;
};

const FX: Record<FxProfile, FxPreset> = {
  celebrate: {
    dry: 0.84,
    wetSend: 0.38,
    wetHpHz: 160,
    delayS: 0.058,
    fb: 0.2,
    fbLpHz: 3400,
    revWet: 0.48,
    irDur: 1.28,
    irDecay: 2.35,
    makeup: 1.06,
  },
  standard: {
    dry: 0.9,
    wetSend: 0.26,
    wetHpHz: 200,
    delayS: 0.045,
    fb: 0.16,
    fbLpHz: 4000,
    revWet: 0.32,
    irDur: 0.88,
    irDecay: 2.75,
    makeup: 1.04,
  },
  tight: {
    dry: 0.96,
    wetSend: 0.14,
    wetHpHz: 280,
    delayS: 0.03,
    fb: 0.1,
    fbLpHz: 5200,
    revWet: 0.2,
    irDur: 0.55,
    irDecay: 3.1,
    makeup: 1.02,
  },
};

/** Mild saturation before dynamics — reads fuller / less “cheap oscillator” */
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

const makeMasterCompressor = (c: AudioContext, profile: FxProfile): DynamicsCompressorNode => {
  const comp = c.createDynamicsCompressor();
  comp.knee.value = 10;
  comp.ratio.value = 4;
  if (profile === "celebrate") {
    comp.threshold.value = -17;
    comp.attack.value = 0.008;
    comp.release.value = 0.34;
  } else if (profile === "tight") {
    comp.threshold.value = -13;
    comp.attack.value = 0.004;
    comp.release.value = 0.17;
  } else {
    comp.threshold.value = -15;
    comp.attack.value = 0.006;
    comp.release.value = 0.26;
  }
  comp.connect(c.destination);
  return comp;
};

/** Convolution room — separate IR per profile keeps tails matched to use-case */
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

/**
 * Everything feeds `masterIn`:
 * dry branch stays punchy; wet branch = HP → feedback delay → reverb → sum → clip → compressor.
 */
const createMasterFxIn = (c: AudioContext, profile: FxProfile): AudioNode => {
  const p = FX[profile];
  const masterIn = c.createGain();
  masterIn.gain.value = 1;

  const dryGain = c.createGain();
  dryGain.gain.value = p.dry;

  const wetSend = c.createGain();
  wetSend.gain.value = p.wetSend;

  const wetHp = c.createBiquadFilter();
  wetHp.type = "highpass";
  wetHp.frequency.value = p.wetHpHz;
  wetHp.Q.value = 0.71;

  const delay = c.createDelay(Math.max(0.2, p.delayS + 0.05));
  delay.delayTime.value = p.delayS;

  const fbLp = c.createBiquadFilter();
  fbLp.type = "lowpass";
  fbLp.frequency.value = p.fbLpHz;
  fbLp.Q.value = 0.7;

  const fbGain = c.createGain();
  fbGain.gain.value = p.fb;

  const conv = makeReverb(c, p.irDur, p.irDecay);
  const revWet = c.createGain();
  revWet.gain.value = p.revWet;

  const summer = c.createGain();
  summer.gain.value = p.makeup;

  masterIn.connect(dryGain);
  dryGain.connect(summer);

  masterIn.connect(wetSend);
  wetSend.connect(wetHp);
  wetHp.connect(delay);
  delay.connect(fbLp);
  fbLp.connect(fbGain);
  fbGain.connect(delay);
  delay.connect(conv);
  conv.connect(revWet);
  revWet.connect(summer);

  const clip = makeSoftClipper(c);
  const comp = makeMasterCompressor(c, profile);
  summer.connect(clip);
  clip.connect(comp);

  return masterIn;
};

/** Lush parallel verb for procedural goal fanfare chords (in addition to master FX glue). */
const makeFanfareReverb = (c: AudioContext): ConvolverNode => makeReverb(c, 1.55, 2.15);

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

/** Bandpassed noise = crisp transient impact without harsh digital edges */
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

// ─── Subtask complete — sample first + synth weight tail ─────────────────────
export const playSubtaskDone = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  preloadUiSamples(c);
  const master = createMasterFxIn(c, "standard");
  const t = c.currentTime;

  if (playUiSample(c, master, "subtask")) {
    playOscGroup(
      c,
      master,
      [{ freq: 98, gain: 0.085, type: "sine", freqEnd: 58, pan: 0 }],
      t,
      0.002,
      0.12,
    );
    return;
  }

  playNoiseBurst(c, master, t, 0.048, 0.24, 2650, 5.5);

  playOscGroup(
    c,
    master,
    [
      { freq: 880, gain: 0.13, type: "triangle", pan: -0.28 },
      { freq: 880, gain: 0.11, type: "sine", pan: -0.28 },
      { freq: 1320, gain: 0.095, type: "sine", pan: 0.15 },
      { freq: 1760, gain: 0.068, type: "sine", pan: 0.38 },
      { freq: 2200, gain: 0.038, type: "sine", pan: 0 },
    ],
    t,
    0.004,
    0.36,
  );

  playOscGroup(
    c,
    master,
    [
      { freq: 128, gain: 0.17, type: "sine", freqEnd: 68, pan: 0 },
      { freq: 58, gain: 0.1, type: "triangle", freqEnd: 46, pan: -0.12 },
    ],
    t,
    0.002,
    0.15,
  );
};

// ─── Goal complete — sample first + low foundation; else full procedural ─────
export const playGoalDone = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  preloadUiSamples(c);
  const master = createMasterFxIn(c, "celebrate");
  const t = c.currentTime;

  if (playUiSample(c, master, "goal")) {
    playOscGroup(
      c,
      master,
      [
        { freq: 65.41, gain: 0.12, type: "triangle" },
        { freq: 130.81, gain: 0.08, type: "sine" },
      ],
      t,
      0.018,
      0.48,
    );
    return;
  }

  const fanVerb = makeFanfareReverb(c);
  fanVerb.connect(master);

  playNoiseBurst(c, master, t, 0.058, 0.2, 1650, 3.8);
  playNoiseBurst(c, master, t + 0.018, 0.045, 0.11, 380, 1.8);

  playOscGroup(
    c,
    master,
    [
      { freq: 65.41, gain: 0.15, type: "triangle" },
      { freq: 130.81, gain: 0.12, type: "sine" },
      { freq: 98.0, gain: 0.06, type: "sine" },
    ],
    t,
    0.022,
    2.55,
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
        { freq, gain: 0.27, type: "triangle" },
        { freq: freq * 2, gain: 0.095, type: "sine" },
        { freq: freq * 3, gain: 0.038, type: "sine" },
      ],
      start,
      0.012,
      1.92,
    );

    playOscGroup(
      c,
      master,
      [
        { freq, gain: 0.12, type: "sine", pan },
        { freq: freq * 2, gain: 0.048, type: "triangle", pan: pan * 0.55 },
      ],
      start,
      0.008,
      0.72,
    );
  });

  playOscGroup(
    c,
    fanVerb,
    [
      { freq: 1318.5, gain: 0.13, type: "triangle", pan: -0.32 },
      { freq: 1760, gain: 0.085, type: "sine", pan: 0.32 },
      { freq: 2093, gain: 0.055, type: "sine", pan: 0.08 },
    ],
    t + 0.33,
    0.016,
    1.72,
  );
};

// ─── Emoji picked ───────────────────────────────────────────────────────────
export const playEmojiSpark = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  preloadUiSamples(c);
  const master = createMasterFxIn(c, "standard");
  const t = c.currentTime;

  if (playUiSample(c, master, "emoji")) return;

  playNoiseBurst(c, master, t, 0.024, 0.065, 3200, 6);

  playOscGroup(
    c,
    master,
    [
      { freq: 990, gain: 0.11, type: "triangle", freqEnd: 1320, pan: -0.2 },
      { freq: 1320, gain: 0.055, type: "sine", freqEnd: 1760, pan: 0.22 },
      { freq: 1980, gain: 0.032, type: "sine", freqEnd: 2340, pan: 0 },
    ],
    t,
    0.003,
    0.09,
  );
};

// ─── Add goal/subtask ────────────────────────────────────────────────────────
export const playPop = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  preloadUiSamples(c);
  const master = createMasterFxIn(c, "tight");
  const t = c.currentTime;

  if (playUiSample(c, master, "pop")) return;

  playNoiseBurst(c, master, t, 0.038, 0.13, 820, 2.2);

  playOscGroup(
    c,
    master,
    [
      { freq: 420, gain: 0.07, type: "triangle", freqEnd: 620, pan: -0.18 },
      { freq: 520, gain: 0.14, type: "sine", freqEnd: 800, pan: 0 },
      { freq: 780, gain: 0.075, type: "triangle", freqEnd: 1080, pan: 0.2 },
    ],
    t,
    0.007,
    0.22,
  );
};

// ─── Delete ─────────────────────────────────────────────────────────────────
export const playRemove = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  preloadUiSamples(c);
  const master = createMasterFxIn(c, "tight");
  const t = c.currentTime;

  if (playUiSample(c, master, "remove")) return;

  playNoiseBurst(c, master, t, 0.032, 0.09, 520, 1.5);

  playOscGroup(
    c,
    master,
    [
      { freq: 420, gain: 0.09, type: "triangle", freqEnd: 260, pan: -0.15 },
      { freq: 500, gain: 0.11, type: "sine", freqEnd: 280, pan: 0.12 },
      { freq: 320, gain: 0.045, type: "sine", freqEnd: 180, pan: 0 },
    ],
    t,
    0.005,
    0.22,
  );
};

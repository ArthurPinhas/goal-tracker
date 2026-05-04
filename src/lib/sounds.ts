const STORAGE_KEY = 'sounds-enabled';

export const isSoundEnabled = (): boolean => {
  try { return localStorage.getItem(STORAGE_KEY) !== 'false'; } catch { return true; }
};
export const toggleSound = (): boolean => {
  const next = !isSoundEnabled();
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
};

let _ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch { return null; }
};

// Primed compressor wired to destination — gives punch and prevents clipping
const makeCompressor = (c: AudioContext) => {
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.knee.value = 6;
  comp.ratio.value = 6;
  comp.attack.value = 0.002;
  comp.release.value = 0.1;
  comp.connect(c.destination);
  return comp;
};

// Synthetic reverb via noise impulse
const makeReverb = (c: AudioContext, duration = 0.8, decay = 3): ConvolverNode => {
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

type OscDef = { freq: number; type?: OscillatorType; gain: number; freqEnd?: number };

const playOscGroup = (
  c: AudioContext,
  dest: AudioNode,
  oscs: OscDef[],
  startTime: number,
  attack: number,
  decay: number,
) => {
  oscs.forEach(({ freq, type = 'sine', gain, freqEnd }) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(dest);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd !== undefined) osc.frequency.linearRampToValueAtTime(freqEnd, startTime + attack + 0.04);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain, startTime + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);
    osc.start(startTime);
    osc.stop(startTime + decay + 0.05);
  });
};

// ─── Subtask complete — satisfying bright chime with harmonics ─────────────
export const playSubtaskDone = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const comp = makeCompressor(c);
  const t = c.currentTime;
  // Fundamental + 2nd harmonic + minor 7th overtone → bell-like character
  playOscGroup(c, comp, [
    { freq: 880,  gain: 0.18, type: 'sine' },
    { freq: 1320, gain: 0.08, type: 'sine' },
    { freq: 1760, gain: 0.05, type: 'sine' },
  ], t, 0.006, 0.28);
  // Tiny low "thud" gives tactile weight
  playOscGroup(c, comp, [
    { freq: 120, gain: 0.12, type: 'sine', freqEnd: 60 },
  ], t, 0.003, 0.08);
};

// ─── Goal complete — triumphant fanfare chord with reverb ──────────────────
export const playGoalDone = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const comp = makeCompressor(c);
  const reverb = makeReverb(c, 1.2, 2.5);
  reverb.connect(comp);
  const t = c.currentTime;

  // Strum C major chord: C4 → E4 → G4 → C5 ascending with slight delay
  const chord = [
    { freq: 261.6, delay: 0 },
    { freq: 329.6, delay: 0.07 },
    { freq: 392.0, delay: 0.14 },
    { freq: 523.3, delay: 0.21 },
    { freq: 659.3, delay: 0.28 }, // E5 on top — bright finish
  ];

  chord.forEach(({ freq, delay }) => {
    const start = t + delay;
    // Main tone → reverb
    playOscGroup(c, reverb, [
      { freq, gain: 0.22, type: 'triangle' },
      { freq: freq * 2, gain: 0.07, type: 'sine' },
    ], start, 0.01, 1.6);
    // Dry layer → comp direct (add presence)
    playOscGroup(c, comp, [
      { freq, gain: 0.08, type: 'sine' },
    ], start, 0.01, 0.5);
  });

  // Final shimmer — high sparkle at top
  playOscGroup(c, reverb, [
    { freq: 1318.5, gain: 0.10, type: 'sine' },
    { freq: 1760,   gain: 0.06, type: 'sine' },
  ], t + 0.35, 0.015, 1.4);
};

// ─── Add goal/subtask — airy rising pop ───────────────────────────────────
export const playPop = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const comp = makeCompressor(c);
  const t = c.currentTime;
  playOscGroup(c, comp, [
    { freq: 520, gain: 0.13, type: 'sine', freqEnd: 780 },
    { freq: 780, gain: 0.06, type: 'sine', freqEnd: 1040 },
  ], t, 0.008, 0.18);
};

// ─── Delete — soft descending dismiss ─────────────────────────────────────
export const playRemove = () => {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const comp = makeCompressor(c);
  const t = c.currentTime;
  playOscGroup(c, comp, [
    { freq: 500, gain: 0.10, type: 'sine', freqEnd: 300 },
    { freq: 380, gain: 0.05, type: 'sine', freqEnd: 220 },
  ], t, 0.006, 0.18);
};

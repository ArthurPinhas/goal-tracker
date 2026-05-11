/**
 * CC0 samples sourced from Kenney "Interface Sounds" (via Calinou’s mirror for stable raw URLs).
 * License text: public/sounds/LICENSE-CC0-Kenney.txt
 */

export type UiSoundKey = "goal" | "subtask" | "pop" | "remove" | "emoji";

const SAMPLE_FILES: Record<UiSoundKey, string> = {
  goal: "goal-complete.wav",
  subtask: "subtask-complete.wav",
  pop: "pop.wav",
  remove: "remove.wav",
  emoji: "emoji-spark.wav",
};

/** Per-cue gain — WAV peaks differ; keeps levels close to procedural mix */
const SAMPLE_GAIN: Record<UiSoundKey, number> = {
  goal: 0.72,
  subtask: 0.78,
  pop: 0.82,
  remove: 0.74,
  emoji: 0.7,
};

const buffers: Partial<Record<UiSoundKey, AudioBuffer>> = {};
const inflight = new Map<UiSoundKey, Promise<void>>();

function soundUrl(file: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${base}sounds/${file}`;
}

async function loadSample(ctx: AudioContext, key: UiSoundKey): Promise<void> {
  if (buffers[key]) return;
  const path = SAMPLE_FILES[key];
  const res = await fetch(soundUrl(path));
  if (!res.ok) throw new Error(`Sound fetch failed: ${path}`);
  const ab = await res.arrayBuffer();
  const decoded = await ctx.decodeAudioData(ab.slice(0));
  buffers[key] = decoded;
}

/**
 * Warm the decode cache (call after AudioContext exists). Failed files are skipped — synth fallback applies.
 */
export function preloadUiSamples(ctx: AudioContext): void {
  for (const key of Object.keys(SAMPLE_FILES) as UiSoundKey[]) {
    if (buffers[key] || inflight.has(key)) continue;
    const p = loadSample(ctx, key)
      .catch(() => {
        /* Missing file or decode error — procedural fallback */
      })
      .then(() => undefined);
    inflight.set(key, p);
  }
}

/** Schedules one-shot buffer through dest. Returns false if not loaded yet. */
export function playUiSample(c: AudioContext, dest: AudioNode, key: UiSoundKey): boolean {
  const buf = buffers[key];
  if (!buf) return false;
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  g.gain.value = SAMPLE_GAIN[key];
  src.connect(g);
  g.connect(dest);
  src.start(c.currentTime);
  return true;
}

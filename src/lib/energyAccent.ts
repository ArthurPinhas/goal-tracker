/** High-vibrancy “energy” accents — cyan, lime, magenta — keyed off category or goal id */
export type EnergyHue = "cyan" | "lime" | "magenta";

const ACCENTS: Record<
  EnergyHue,
  { border: string; glow: string; particle: string; ringRgb: string }
> = {
  cyan: {
    border: "rgba(34, 211, 238, 0.45)",
    glow: "0 0 28px rgba(34, 211, 238, 0.28)",
    particle: "#22d3ee",
    ringRgb: "34, 211, 238",
  },
  lime: {
    border: "rgba(163, 230, 53, 0.5)",
    glow: "0 0 28px rgba(163, 230, 53, 0.26)",
    particle: "#a3e635",
    ringRgb: "163, 230, 53",
  },
  magenta: {
    border: "rgba(244, 114, 182, 0.5)",
    glow: "0 0 28px rgba(244, 114, 182, 0.24)",
    particle: "#f472b6",
    ringRgb: "244, 114, 182",
  },
};

const HUES: EnergyHue[] = ["cyan", "lime", "magenta"];

function hashSeed(goalId: string, categoryId: string | null | undefined): number {
  const s = `${categoryId ?? ""}:${goalId}`;
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getEnergyAccent(goalId: string, categoryId: string | null | undefined) {
  const hue = HUES[hashSeed(goalId, categoryId) % HUES.length];
  return { hue, ...ACCENTS[hue] };
}

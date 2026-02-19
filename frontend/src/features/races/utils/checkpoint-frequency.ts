import type { RouteSummary } from '@/types/api';

/* ── Configurable heat-map color palettes ─────────────────────────── */

export interface HeatPalette {
  /** Display name */
  name: string;
  /** Background for cells with a count of exactly 0 */
  zero: string;
  /** Background when every non-zero value in the column is identical */
  uniform: string;
  /** Maps a normalised value t ∈ [0, 1] to a CSS colour string */
  color: (t: number) => string;
}

export const PALETTES = {
  /** Red → Yellow → Green  (high frequency = green) */
  verdant: {
    name: 'Verdant',
    zero: 'hsl(0, 0%, 88%)',
    uniform: 'hsl(120, 35%, 88%)',
    color: (t: number) => {
      const hue = t <= 0.5
        ? 0 + 45 * (t / 0.5)                       // 0 → 45
        : 45 + (120 - 45) * ((t - 0.5) / 0.5);     // 45 → 120
      const saturation = 38 + 20 * t;                // 38 % → 58 %
      const lightness  = 92 - 12 * t;                // 92 % → 80 %
      return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
    },
  },

  /** Pale blue → Indigo → Deep navy  (high frequency = deep blue) */
  ocean: {
    name: 'Ocean',
    zero: 'hsl(0, 0%, 88%)',
    uniform: 'hsl(220, 40%, 86%)',
    color: (t: number) => {
      const hue = 210 - 10 * t;                     // 210 → 200
      const saturation = 30 + 45 * t;                // 30 % → 75 %
      const lightness  = 93 - 22 * t;                // 93 % → 71 %
      return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
    },
  },
} satisfies Record<string, HeatPalette>;

export type PaletteName = keyof typeof PALETTES;

/* ── Heat-color function ──────────────────────────────────────────── */

export function heatColor(
  value: number,
  min: number,
  max: number,
  palette: HeatPalette = PALETTES.ocean,
): string {
  if (value === 0) return palette.zero;
  if (min === max) return palette.uniform;
  const t = (value - min) / (max - min);
  return palette.color(t);
}

export function buildPositionUsage(
  routes: RouteSummary[],
): Map<number, Map<number, number>> {
  const positionUsage = new Map<number, Map<number, number>>();
  for (const route of routes) {
    const seq = route.location_sequence;
    // Skip index 0 (start) and last index (finish), only count intermediate checkpoints
    for (let i = 1; i < seq.length - 1; i++) {
      const loc = seq[i];
      const cpNumber = i; // checkpoint position (1-based)
      if (!positionUsage.has(loc.id)) {
        positionUsage.set(loc.id, new Map());
      }
      const locMap = positionUsage.get(loc.id)!;
      locMap.set(cpNumber, (locMap.get(cpNumber) || 0) + 1);
    }
  }
  return positionUsage;
}

export function buildColBounds(
  positionUsage: Map<number, Map<number, number>>,
  numCPs: number,
): Map<number, { min: number; max: number }> {
  const colBounds = new Map<number, { min: number; max: number }>();
  for (let cp = 1; cp <= numCPs; cp++) {
    let min = Infinity;
    let max = -Infinity;
    for (const [, locMap] of positionUsage) {
      const count = locMap.get(cp) || 0;
      if (count < min) min = count;
      if (count > max) max = count;
    }
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 0;
    colBounds.set(cp, { min, max });
  }
  return colBounds;
}

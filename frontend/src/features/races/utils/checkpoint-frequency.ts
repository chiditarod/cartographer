import type { RouteSummary } from '@/types/api';

export function heatColor(value: number, min: number, max: number): string {
  if (min === max) return 'hsl(0, 0%, 92%)';
  const t = (value - min) / (max - min);
  // green (120) at low → yellow (45) at mid → red (0) at high
  const hue = t <= 0.5
    ? 120 - (120 - 45) * (t / 0.5)
    : 45 - 45 * ((t - 0.5) / 0.5);
  const saturation = 40 + 10 * t; // 40% → 50%
  const lightness = 90 - 2 * t;   // 90% → 88%
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
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

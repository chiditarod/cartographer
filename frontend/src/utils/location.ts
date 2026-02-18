/**
 * Abbreviate a location name by taking the first character of each word.
 * "Phyllis' Musical Inn" → "PMI", "5 Star Bar" → "5SB"
 */
export function abbreviateLocation(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Palette of 14 distinct Tailwind-compatible color pairs.
 * Each entry is [bgClass, textClass].
 */
const LOCATION_COLORS: [string, string][] = [
  ['bg-blue-100', 'text-blue-800'],
  ['bg-emerald-100', 'text-emerald-800'],
  ['bg-amber-100', 'text-amber-800'],
  ['bg-rose-100', 'text-rose-800'],
  ['bg-violet-100', 'text-violet-800'],
  ['bg-cyan-100', 'text-cyan-800'],
  ['bg-orange-100', 'text-orange-800'],
  ['bg-teal-100', 'text-teal-800'],
  ['bg-pink-100', 'text-pink-800'],
  ['bg-indigo-100', 'text-indigo-800'],
  ['bg-lime-100', 'text-lime-800'],
  ['bg-fuchsia-100', 'text-fuchsia-800'],
  ['bg-sky-100', 'text-sky-800'],
  ['bg-red-100', 'text-red-800'],
];

/**
 * Build a map from location ID to its unique color classes.
 * Uses index position in the locations array (which is sorted by name from the API).
 */
export function buildLocationColorMap(
  locations: { id: number }[]
): Map<number, string> {
  const map = new Map<number, string>();
  locations.forEach((loc, index) => {
    const [bg, text] = LOCATION_COLORS[index % LOCATION_COLORS.length];
    map.set(loc.id, `${bg} ${text}`);
  });
  return map;
}

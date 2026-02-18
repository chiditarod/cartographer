export function formatDistance(distance: number, unit: 'mi' | 'km'): string {
  return `${distance.toFixed(2)} ${unit}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

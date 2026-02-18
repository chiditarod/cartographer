import { ApiError } from '@/lib/api-client';

export function formatDistance(distance: number, unit: 'mi' | 'km'): string {
  return `${distance.toFixed(2)} ${unit}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function formatMutationError(error: Error | null): string | null {
  if (!error) return null;
  if (error instanceof ApiError && error.errors.length > 0) {
    return error.errors.join('. ');
  }
  return error.message;
}

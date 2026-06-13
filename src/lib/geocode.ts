/**
 * Geocoding via Photon (photon.komoot.io) — runs entirely client-side.
 *
 * Photon does NOT support lang=es (returns 400). Use 'en', 'de', 'fr', or 'it'.
 * Control the language via NEXT_PUBLIC_GEOCODE_LANG (defaults to 'en').
 *
 * Location bias: the search is biased toward DEFAULT_CENTER so results
 * for ambiguous queries (e.g. "Springfield") prefer the configured region.
 */

import { DEFAULT_CENTER } from '@/lib/mapConfig';
import type { GeocodeResult } from '@/lib/types';

const LANG =
  (process.env.NEXT_PUBLIC_GEOCODE_LANG ?? 'en').toLowerCase() || 'en';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function buildLabel(p: PhotonFeature['properties']): string {
  const parts: string[] = [];

  if (p.name) parts.push(p.name);

  const street =
    p.street && p.housenumber
      ? `${p.street} ${p.housenumber}`
      : p.street ?? '';
  if (street && street !== p.name) parts.push(street);

  if (p.postcode) parts.push(p.postcode);
  if (p.city && p.city !== p.name) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);

  return parts.join(', ') || 'Unknown location';
}

/**
 * Search for addresses using the Photon geocoding API.
 *
 * @param q     - The search query (should be >= 3 chars; caller enforces)
 * @param signal - AbortSignal to cancel stale requests
 * @returns     Resolved list of geocode results, or [] on error/abort
 */
export async function searchAddress(
  q: string,
  signal: AbortSignal,
): Promise<GeocodeResult[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '6');
  url.searchParams.set('lang', LANG);
  url.searchParams.set('lat', String(DEFAULT_CENTER[0]));
  url.searchParams.set('lon', String(DEFAULT_CENTER[1]));

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return [];
    const data: PhotonResponse = await res.json();
    return data.features.map((f) => ({
      label: buildLabel(f.properties),
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    }));
  } catch {
    // AbortError or network error — return empty list silently
    return [];
  }
}

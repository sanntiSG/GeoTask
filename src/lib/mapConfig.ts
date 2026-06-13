/**
 * Map configuration loaded from NEXT_PUBLIC_* environment variables.
 * All variables have safe defaults so the app works with no .env file.
 *
 * NEXT_PUBLIC_* vars are inlined by Next.js at build/dev-start time.
 * After changing any of these in .env.local you must restart `npm run dev`.
 */

const DEFAULT_LAT = -34.603;
const DEFAULT_LNG = -58.381;
const DEFAULT_ZOOM = 12;
const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function parseFloat(val: string | undefined, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function parseInt(val: string | undefined, fallback: number): number {
  const n = Math.round(Number(val));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_TILE_URL;

export const MAP_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || DEFAULT_ATTRIBUTION;

export const DEFAULT_CENTER: [number, number] = [
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT, DEFAULT_LAT),
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG, DEFAULT_LNG),
];

export const DEFAULT_ZOOM_LEVEL = parseInt(
  process.env.NEXT_PUBLIC_DEFAULT_ZOOM,
  DEFAULT_ZOOM,
);

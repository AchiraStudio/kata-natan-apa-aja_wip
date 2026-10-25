import type L from 'leaflet';

/**
 * CARTO Raster Basemap Configuration for TITIK.
 *
 * CARTO requires an API key to serve clean, watermark-free basemaps.
 * The key is passed via the `?key=` query parameter.
 *
 * Fallback strategy:
 * 1. If VITE_CARTO_API_KEY is configured in .env, TITIK requests CARTO tiles with `?key=...`.
 * 2. If VITE_CARTO_API_KEY is missing or undefined, TITIK immediately routes to OpenStreetMap
 *    standard tiles so no "API KEY REQUIRED" watermark ever appears.
 * 3. If any tile fails during network transmission, Leaflet automatically retries via OSM fallback.
 */

export const CARTO_VOYAGER_BASE = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
export const CARTO_POSITRON_BASE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
export const CARTO_DARK_BASE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
export const OSM_FALLBACK_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export interface CreateTileLayerOptions {
  theme?: 'light' | 'dark';
}

export interface CivicTileConfig {
  url: string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
}

export function getCivicTileConfig(options: CreateTileLayerOptions = {}): CivicTileConfig {
  const isDark = options.theme === 'dark';
  const cartoApiKey = (import.meta.env.VITE_CARTO_API_KEY as string | undefined)?.trim();
  const configuredStyle = (import.meta.env.VITE_CARTO_STYLE as string | undefined)?.trim() || 'voyager';

  if (cartoApiKey) {
    const baseCartoUrl = isDark
      ? CARTO_DARK_BASE
      : configuredStyle === 'light_all'
        ? CARTO_POSITRON_BASE
        : CARTO_VOYAGER_BASE;

    return {
      url: `${baseCartoUrl}?key=${encodeURIComponent(cartoApiKey)}`,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    };
  }

  return {
    url: OSM_FALLBACK_URL,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 20,
  };
}

export function createCivicTileLayer(
  leaflet: typeof L,
  options: CreateTileLayerOptions = {}
): L.TileLayer {
  const config = getCivicTileConfig(options);

  const tileLayer = leaflet.tileLayer(config.url, {
    attribution: config.attribution,
    subdomains: config.subdomains,
    maxZoom: config.maxZoom,
  });

  // Resilient fallback: seamlessly route to OSM tiles if an individual tile fails
  tileLayer.on('tileerror', (event) => {
    const errorEvent = event as unknown as { tile?: HTMLImageElement; coords?: { x: number; y: number; z: number } };
    const tile = errorEvent.tile;
    const coords = errorEvent.coords;

    if (tile && coords && !tile.dataset.fallbackRetried) {
      tile.dataset.fallbackRetried = 'true';
      tile.src = `https://tile.openstreetmap.org/${coords.z}/${coords.x}/${coords.y}.png`;
    }
  });

  return tileLayer;
}


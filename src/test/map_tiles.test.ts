import { describe, it, expect, afterEach } from 'vitest';
import { getCivicTileConfig, OSM_FALLBACK_URL } from '../utils/mapTiles';

describe('mapTiles utility', () => {
  const originalMapProvider = import.meta.env.VITE_MAP_PROVIDER;
  const originalCartoKey = import.meta.env.VITE_CARTO_API_KEY;
  const originalCartoStyle = import.meta.env.VITE_CARTO_STYLE;

  afterEach(() => {
    import.meta.env.VITE_MAP_PROVIDER = originalMapProvider;
    import.meta.env.VITE_CARTO_API_KEY = originalCartoKey;
    import.meta.env.VITE_CARTO_STYLE = originalCartoStyle;
  });

  it('uses CARTO with ?key= query parameter when VITE_CARTO_API_KEY is present and provider is not forced to osm', () => {
    import.meta.env.VITE_MAP_PROVIDER = 'carto';
    import.meta.env.VITE_CARTO_API_KEY = 'cb1_4n5a_1_893e468eef0ff7be606eb702';
    import.meta.env.VITE_CARTO_STYLE = 'voyager';

    const config = getCivicTileConfig();

    expect(config.url).toContain('rastertiles/voyager');
    expect(config.url).toContain('?key=cb1_4n5a_1_893e468eef0ff7be606eb702');
    expect(config.subdomains).toBe('abcd');
    expect(config.attribution).toContain('CARTO');
  });

  it('falls back to OpenStreetMap when VITE_CARTO_API_KEY is missing to avoid watermark tiles', () => {
    import.meta.env.VITE_MAP_PROVIDER = 'carto';
    import.meta.env.VITE_CARTO_API_KEY = '';

    const config = getCivicTileConfig();

    expect(config.url).toBe(OSM_FALLBACK_URL);
    expect(config.attribution).toContain('OpenStreetMap');
    expect(config.attribution).not.toContain('CARTO');
  });

  it('unconditionally uses OpenStreetMap when VITE_MAP_PROVIDER is osm to prevent watermark tiles', () => {
    import.meta.env.VITE_MAP_PROVIDER = 'osm';
    import.meta.env.VITE_CARTO_API_KEY = 'any_unverified_key';

    const config = getCivicTileConfig();

    expect(config.url).toBe(OSM_FALLBACK_URL);
    expect(config.attribution).toContain('OpenStreetMap');
    expect(config.attribution).not.toContain('CARTO');
  });

  it('supports dark theme tile layer configuration with CARTO Dark Matter', () => {
    import.meta.env.VITE_MAP_PROVIDER = 'carto';
    import.meta.env.VITE_CARTO_API_KEY = 'cb1_4n5a_1_893e468eef0ff7be606eb702';

    const config = getCivicTileConfig({ theme: 'dark' });

    expect(config.url).toContain('dark_all');
    expect(config.url).toContain('?key=cb1_4n5a_1_893e468eef0ff7be606eb702');
  });

  it('supports positron style when configured in environment', () => {
    import.meta.env.VITE_MAP_PROVIDER = 'carto';
    import.meta.env.VITE_CARTO_API_KEY = 'cb1_4n5a_1_893e468eef0ff7be606eb702';
    import.meta.env.VITE_CARTO_STYLE = 'light_all';

    const config = getCivicTileConfig();

    expect(config.url).toContain('light_all');
    expect(config.url).toContain('?key=cb1_4n5a_1_893e468eef0ff7be606eb702');
  });
});


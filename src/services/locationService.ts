// =============================================================================
// TITIK. — Location Service
// User-initiated geolocation, coordinate validation, distance calculation & privacy
// =============================================================================

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
  message: string;
}

/**
 * Requests the user's current GPS location.
 * MUST only be invoked after an explicit user action (e.g. clicking "Gunakan Lokasi Saya").
 * Never request on page load.
 */
export const requestCurrentPosition = async (): Promise<GeolocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 'NOT_SUPPORTED',
        message: 'Perangkat atau peramban Anda tidak mendukung sensor Geolocation.',
      } as GeolocationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: Math.round(position.coords.accuracy),
        });
      },
      (error) => {
        let code: GeolocationError['code'] = 'POSITION_UNAVAILABLE';
        let message = 'Tidak dapat mendeteksi koordinat lokasi Anda.';

        if (error.code === error.PERMISSION_DENIED) {
          code = 'PERMISSION_DENIED';
          message = 'Izin akses lokasi ditolak. Silakan izinkan akses lokasi pada peramban Anda atau pilih titik langsung di peta.';
        } else if (error.code === error.TIMEOUT) {
          code = 'TIMEOUT';
          message = 'Waktu permintaan lokasi habis. Silakan coba lagi atau tandai manual di peta.';
        }

        reject({ code, message } as GeolocationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  });
};

/**
 * Validates latitude and longitude ranges.
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Calculates distance in meters between two coordinates using the Haversine formula.
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Rounds coordinate to 3 decimal places (~110m precision) for privacy generalization.
 */
export const generalizeCoordinates = (
  lat: number,
  lng: number
): [number, number] => {
  return [
    Math.round(lat * 1000) / 1000,
    Math.round(lng * 1000) / 1000,
  ];
};


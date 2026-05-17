import { HTTP_STATUS } from '../constants';
import { AppError, BadRequestError } from '../shared/errors';

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string | undefined>;
};

type NominatimReverseResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
};

export type ResolvedLocation = {
  location: string;
  latitude: number | null;
  longitude: number | null;
};

const ADDRESS_CACHE = new Map<string, ResolvedLocation>();
const GEOCODING_TIMEOUT_MS = 6000;
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const DEFAULT_COUNTRY_CODES = 'ba';

function isGeocodingDisabled(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.GEOCODING_DISABLED === 'true';
}

function getNominatimBaseUrl(): string {
  return (process.env.NOMINATIM_URL || DEFAULT_NOMINATIM_URL).replace(/\/+$/, '');
}

function getGeocodingUserAgent(): string {
  return process.env.GEOCODING_USER_AGENT || 'SIGrupa7-ServiceInterventions/1.0';
}

function getCountryCodes(): string {
  return process.env.GEOCODING_COUNTRY_CODES ?? DEFAULT_COUNTRY_CODES;
}

function normalizeAddress(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(7));
}

function assertCoordinateRange(latitude: number, longitude: number): void {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new BadRequestError('Invalid location coordinates.', [
      { field: 'latitude', message: 'Latitude must be between -90 and 90.' },
      { field: 'longitude', message: 'Longitude must be between -180 and 180.' },
    ]);
  }
}

function hasUsableAddressDetail(address: Record<string, string | undefined> | undefined): boolean {
  if (!address) {
    return false;
  }

  return Boolean(
    address.road ||
      address.pedestrian ||
      address.footway ||
      address.building ||
      address.house_number ||
      address.suburb ||
      address.neighbourhood ||
      address.city ||
      address.town ||
      address.village ||
      address.municipality,
  );
}

function buildGeocodingError(field = 'location'): BadRequestError {
  return new BadRequestError('Location must be a real address that can be placed on the map.', [
    {
      field,
      message: 'Enter a recognizable street, building, city, or use current location.',
    },
  ]);
}

async function fetchNominatim<T>(path: string, params: URLSearchParams): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOCODING_TIMEOUT_MS);

  try {
    const response = await fetch(`${getNominatimBaseUrl()}${path}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': getGeocodingUserAgent(),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AppError(
        response.status === HTTP_STATUS.TOO_MANY_REQUESTS ? HTTP_STATUS.SERVICE_UNAVAILABLE : HTTP_STATUS.BAD_REQUEST,
        'Address validation service is temporarily unavailable.',
        'GEOCODING_UNAVAILABLE',
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      'Address validation service is temporarily unavailable.',
      'GEOCODING_UNAVAILABLE',
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeAddress(address: string): Promise<ResolvedLocation> {
  const normalized = normalizeAddress(address);
  const cacheKey = `search:${getCountryCodes()}:${normalized.toLowerCase()}`;
  const cached = ADDRESS_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (isGeocodingDisabled()) {
    return { location: normalized, latitude: null, longitude: null };
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
    q: normalized,
  });
  const countryCodes = getCountryCodes().trim();
  if (countryCodes) {
    params.set('countrycodes', countryCodes);
  }

  const results = await fetchNominatim<NominatimSearchResult[]>('/search', params);
  const result = results[0];
  if (!result || !hasUsableAddressDetail(result.address)) {
    throw buildGeocodingError();
  }

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw buildGeocodingError();
  }

  assertCoordinateRange(latitude, longitude);

  const resolved = {
    location: normalizeAddress(result.display_name),
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
  };
  ADDRESS_CACHE.set(cacheKey, resolved);
  return resolved;
}

async function reverseGeocode(latitude: number, longitude: number, fallbackLocation: string): Promise<ResolvedLocation> {
  assertCoordinateRange(latitude, longitude);
  const roundedLatitude = roundCoordinate(latitude);
  const roundedLongitude = roundCoordinate(longitude);
  const cacheKey = `reverse:${roundedLatitude}:${roundedLongitude}`;
  const cached = ADDRESS_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (isGeocodingDisabled()) {
    return {
      location: normalizeAddress(fallbackLocation) || `${roundedLatitude}, ${roundedLongitude}`,
      latitude: roundedLatitude,
      longitude: roundedLongitude,
    };
  }

  const result = await fetchNominatim<NominatimReverseResult>(
    '/reverse',
    new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      lat: String(roundedLatitude),
      lon: String(roundedLongitude),
      zoom: '18',
    }),
  );

  if (!result.display_name || !hasUsableAddressDetail(result.address)) {
    throw buildGeocodingError('latitude');
  }

  const resolved = {
    location: normalizeAddress(result.display_name),
    latitude: roundedLatitude,
    longitude: roundedLongitude,
  };
  ADDRESS_CACHE.set(cacheKey, resolved);
  return resolved;
}

export async function resolvePersistableLocation(input: {
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  required?: boolean;
}): Promise<ResolvedLocation> {
  const location = normalizeAddress(input.location ?? '');
  const hasLatitude = input.latitude !== null && input.latitude !== undefined;
  const hasLongitude = input.longitude !== null && input.longitude !== undefined;

  if (hasLatitude || hasLongitude) {
    const latitude = input.latitude;
    const longitude = input.longitude;

    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      throw new BadRequestError('Invalid location coordinates.', [
        { field: 'latitude', message: 'Latitude and longitude must both be valid numbers.' },
        { field: 'longitude', message: 'Latitude and longitude must both be valid numbers.' },
      ]);
    }

    return reverseGeocode(latitude, longitude, location);
  }

  if (!location) {
    if (input.required) {
      throw new BadRequestError('Location is required.', [
        { field: 'location', message: 'Location is required.' },
      ]);
    }

    return { location: '', latitude: null, longitude: null };
  }

  if (location.length < 3) {
    throw buildGeocodingError();
  }

  return geocodeAddress(location);
}

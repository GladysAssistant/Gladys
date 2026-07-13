// Nominatim is the OpenStreetMap geocoding service: free, no API key needed.
// Usage policy (https://operations.osmfoundation.org/policies/nominatim/):
// max 1 request/second, so only search on an explicit user action.
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_TIMEOUT_MS = 10000;

export async function searchAddress(query) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '5',
    q: query
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);
  try {
    const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }
    const results = await response.json();
    return results
      .map(result => ({
        id: result.place_id,
        label: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      }))
      .filter(result => Number.isFinite(result.latitude) && Number.isFinite(result.longitude));
  } finally {
    clearTimeout(timeout);
  }
}

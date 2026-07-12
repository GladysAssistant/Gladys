// Nominatim is the OpenStreetMap geocoding service: free, no API key needed.
// Usage policy (https://operations.osmfoundation.org/policies/nominatim/):
// max 1 request/second, so only search on an explicit user action.
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

export async function searchAddress(query) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '5',
    q: query
  });
  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }
  const results = await response.json();
  return results.map(result => ({
    label: result.display_name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon)
  }));
}

import leaflet from 'leaflet';

import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap (https://openfreemap.org) hosts the open Positron/Dark Matter
// styles previously served by CARTO, without any API key, and documents how
// to self-host the full tile stack.
const OPENFREEMAP_STYLE_BASE_URL = 'https://tiles.openfreemap.org/styles';

const VECTOR_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

const RASTER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (e) {
    return false;
  }
};

const addRasterTileLayer = leafletMap => {
  return leaflet
    .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: RASTER_ATTRIBUTION,
      maxZoom: 19
    })
    .addTo(leafletMap);
};

// Adds the Gladys basemap to a Leaflet map: OpenFreeMap vector tiles
// (positron in light mode, dark in dark mode), or raster OpenStreetMap
// tiles when WebGL is not available. MapLibre GL is loaded on demand so
// it stays out of the main bundle.
const addMapTileLayer = async (leafletMap, isDarkMode) => {
  if (isWebGLAvailable()) {
    try {
      const { maplibreGL } = await import('@maplibre/maplibre-gl-leaflet');
      return maplibreGL({
        style: `${OPENFREEMAP_STYLE_BASE_URL}/${isDarkMode ? 'dark' : 'positron'}`,
        attribution: VECTOR_ATTRIBUTION,
        maxZoom: 19
      }).addTo(leafletMap);
    } catch (e) {
      // The MapLibre module failed to load, or the map was removed while it
      // was loading: fall back to raster tiles below.
    }
  }
  try {
    return addRasterTileLayer(leafletMap);
  } catch (e) {
    // The map was removed while the tile layer was being added.
    return null;
  }
};

export { addMapTileLayer };

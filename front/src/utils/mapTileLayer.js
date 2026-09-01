import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre resolves its web worker next to its own module URL, which no
// longer exists once Vite has bundled it: let Vite bundle the worker as its
// own asset and give MapLibre the resulting URL (see setWorkerUrl below).
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// OpenFreeMap (https://openfreemap.org) hosts the open Positron/Dark Matter
// styles previously served by CARTO, without any API key, and documents how
// to self-host the full tile stack.
const OPENFREEMAP_STYLE_BASE_URL = 'https://tiles.openfreemap.org/styles';

const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

const MAX_ZOOM = 19;

let webGL2Available;

/**
 * @description Check that WebGL2 is available: MapLibre GL v6 dropped WebGL1
 * support, so a WebGL1-only browser cannot render the vector basemap. The
 * result is cached (and the probe context released) so toggling dark mode,
 * which rebuilds every map, does not create a throwaway GL context each time.
 * @returns {boolean} True when a WebGL2 context can be created.
 * @example
 * const supported = isWebGL2Available();
 */
const isWebGL2Available = () => {
  if (webGL2Available === undefined) {
    try {
      const canvas = document.createElement('canvas');
      const context = window.WebGL2RenderingContext && canvas.getContext('webgl2');
      webGL2Available = !!context;
      if (context) {
        const loseContextExtension = context.getExtension('WEBGL_lose_context');
        if (loseContextExtension) {
          loseContextExtension.loseContext();
        }
      }
    } catch (e) {
      webGL2Available = false;
    }
  }
  return webGL2Available;
};

/**
 * @description Add the Gladys basemap to a Leaflet map: OpenFreeMap vector
 * tiles (positron in light mode, dark in dark mode) rendered by MapLibre GL,
 * loaded on demand so it stays out of the main bundle. Without WebGL2, or if
 * MapLibre cannot be loaded, no tile layer is added: the map keeps Leaflet's
 * neutral background (which follows the dark-mode page filter) and markers,
 * areas and click handlers keep working. Raster tiles are deliberately not
 * used as a fallback: there is no key-free provider whose usage policy allows
 * being the default of a distributed app (https://operations.osmfoundation.org/policies/tiles/).
 * @param {object} leafletMap - The Leaflet map to add the tile layer to.
 * @param {boolean} isDarkMode - Whether the dark mode is currently active.
 * @returns {Promise} Resolving with the added layer, or null if none was added.
 * @example
 * await addMapTileLayer(leafletMap, this.props.darkMode);
 */
const addMapTileLayer = async (leafletMap, isDarkMode) => {
  // The basemap layer is added asynchronously, so it cannot bound the map's
  // zoom the way the old raster layer did synchronously. Without a bound,
  // fitBounds on a single point resolves getMaxZoom() to Infinity and
  // corrupts the whole map state (NaN center/zoom): bound the map itself,
  // synchronously, before any fitBounds can run.
  leafletMap.setMaxZoom(MAX_ZOOM);
  if (!isWebGL2Available()) {
    return null;
  }
  try {
    const [{ maplibreGL }, { setWorkerUrl }] = await Promise.all([
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl')
    ]);
    if (!leafletMap.getPane('tilePane')) {
      // The map was removed while MapLibre was loading (e.g. a dark-mode
      // toggle rebuilt it): adding a layer to it would throw.
      return null;
    }
    setWorkerUrl(maplibreWorkerUrl);
    return maplibreGL({
      style: `${OPENFREEMAP_STYLE_BASE_URL}/${isDarkMode ? 'dark' : 'positron'}`,
      // maplibre-gl-leaflet reads attributionControl.customAttribution, not
      // Leaflet's usual attribution option
      attributionControl: { customAttribution: ATTRIBUTION },
      maxZoom: MAX_ZOOM
    }).addTo(leafletMap);
  } catch (e) {
    // The MapLibre module failed to load (offline, stale service worker...),
    // or the map was removed while it was loading.
    console.error('Unable to add the MapLibre GL basemap to the map', e);
    return null;
  }
};

export { addMapTileLayer };

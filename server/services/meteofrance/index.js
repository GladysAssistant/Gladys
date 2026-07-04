const logger = require('../../utils/logger');
const MeteoFranceController = require('./controllers/meteofrance.controller');

const METEOFRANCE_API_KEY_VAR = 'METEOFRANCE_API_KEY';
const METEOFRANCE_WEBSERVICE_URL = 'https://webservice.meteofrance.com';
const METEOFRANCE_PUBLIC_TOKEN = '__Wj7dVSTjV9YGu1guveLyDq0g7S7TfTjaHBTPTpO0kj8__';
const MAP_CACHE_TTL_MS = 15 * 60 * 1000;

module.exports = function MeteoFranceService(gladys, serviceId) {
  const { default: axios } = require('axios');
  let meteoFranceApiKey;
  let mapCache = { image: null, timestamp: 0 };

  /**
   * @public
   * @description This function starts the service. Forecast and vigilance work without
   * any configuration; the API key is optional and only unlocks the vigilance map.
   * @example
   * gladys.services.meteofrance.start();
   */
  async function start() {
    logger.info('Starting MeteoFrance service');
    meteoFranceApiKey = await gladys.variable.getValue(METEOFRANCE_API_KEY_VAR, serviceId);
    if (meteoFranceApiKey) {
      logger.info('MeteoFrance: API key configured, vigilance map available');
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.meteofrance.stop();
   */
  async function stop() {
    logger.info('Stopping MeteoFrance service');
  }

  /**
   * @description Get vigilance warnings for a department from Météo-France mobile webservice.
   * @param {string} dept - French department number (e.g. "06", "75").
   * @returns {Promise<object>} Resolve with warning data (phenomena colors and bulletin text).
   * @example
   * const data = await gladys.services.meteofrance.vigilance.get('06');
   */
  async function getVigilance(dept) {
    const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/v3/warning/full`, {
      params: {
        domain: dept,
        token: METEOFRANCE_PUBLIC_TOKEN,
      },
      timeout: 10000,
    });
    return data;
  }

  /**
   * @description Get the national vigilance map thumbnail (requires the optional API key).
   * @returns {Promise<string|null>} Resolve with a data URL, or null when no API key is configured.
   * @example
   * const image = await gladys.services.meteofrance.vigilance.getMap();
   */
  async function getVigilanceMap() {
    if (!meteoFranceApiKey) {
      return null;
    }
    if (mapCache.image && Date.now() - mapCache.timestamp < MAP_CACHE_TTL_MS) {
      return mapCache.image;
    }
    const url = 'https://public-api.meteofrance.fr/public/DPVigilance/v1/vignettenationale-J/encours';
    const response = await axios.get(url, {
      headers: { apikey: meteoFranceApiKey },
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const contentType = response.headers['content-type'] || 'image/png';
    const image = `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`;
    mapCache = { image, timestamp: Date.now() };
    return image;
  }

  /**
   * @description Get weather forecast from Météo-France mobile webservice.
   * @param {number} lat - Latitude.
   * @param {number} lon - Longitude.
   * @returns {Promise<object>} Resolve with forecast data.
   * @example
   * const data = await gladys.services.meteofrance.forecast.get(48.85, 2.35);
   */
  async function getForecast(lat, lon) {
    const options = {
      params: {
        lat,
        lon,
        lang: 'fr',
        token: METEOFRANCE_PUBLIC_TOKEN,
      },
      // The Météo-France API can take ~20s on a cold cache, then answers in ~50ms
      timeout: 30000,
    };
    try {
      const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/forecast`, options);
      return data;
    } catch (e) {
      logger.info(`[MeteoFrance] getForecast retrying after error: ${e.message}`);
      const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/forecast`, options);
      return data;
    }
  }

  return Object.freeze({
    start,
    stop,
    controllers: MeteoFranceController(gladys, getVigilance, getForecast, getVigilanceMap),
    vigilance: {
      get: getVigilance,
      getMap: getVigilanceMap,
    },
    forecast: {
      get: getForecast,
    },
  });
};

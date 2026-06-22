const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const MeteoFranceController = require('./controllers/meteofrance.controller');

const METEOFRANCE_API_KEY_VAR = 'METEOFRANCE_API_KEY';
const METEOFRANCE_WEBSERVICE_URL = 'https://webservice.meteofrance.com';
const METEOFRANCE_PUBLIC_TOKEN = '__Wj7dVSTjV9YGu1guveLyDq0g7S7TfTjaHBTPTpO0kj8__';

module.exports = function MeteoFranceService(gladys, serviceId) {
  const { default: axios } = require('axios');
  let meteoFranceApiKey;

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.meteofrance.start();
   */
  async function start() {
    logger.info('Starting MeteoFrance service');
    meteoFranceApiKey = await gladys.variable.getValue(METEOFRANCE_API_KEY_VAR, serviceId);
    if (!meteoFranceApiKey) {
      throw new ServiceNotConfiguredError('MeteoFrance Service not configured');
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
   * @description Get vigilance alerts from Météo-France API.
   * @param {string} [dept] - French department number (e.g. "06", "75"). If omitted, returns all departments.
   * @returns {Promise<object>} Resolve with vigilance data.
   * @example
   * const data = await gladys.services.meteofrance.vigilance.get('06');
   */
  async function getVigilance(dept) {
    if (!meteoFranceApiKey) {
      throw new ServiceNotConfiguredError('MeteoFrance API Key not found');
    }
    const url = 'https://public-api.meteofrance.fr/public/DPVigilance/v1/phenomenes_vigi_dept/encours';
    const { data } = await axios.get(url, {
      headers: { apikey: meteoFranceApiKey },
    });
    return data;
  }

  /**
   * @description Get weather forecast from Météo-France mobile webservice.
   * @param {number} lat - Latitude.
   * @param {number} lon - Longitude.
   * @returns {Promise<object>} Resolve with forecast data.
   */
  async function getForecast(lat, lon) {
    const { data } = await axios.get(`${METEOFRANCE_WEBSERVICE_URL}/forecast`, {
      params: {
        lat,
        lon,
        lang: 'fr',
        token: METEOFRANCE_PUBLIC_TOKEN,
      },
      timeout: 10000,
    });
    return data;
  }

  return Object.freeze({
    start,
    stop,
    controllers: MeteoFranceController(gladys, getVigilance, getForecast),
    vigilance: {
      get: getVigilance,
    },
    forecast: {
      get: getForecast,
    },
  });
};

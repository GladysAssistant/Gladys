const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { formatResults } = require('./lib/formatResults');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

const OPENWEATHER_API_KEY = 'OPENWEATHER_API_KEY';

module.exports = function OpenWeatherService(gladys, serviceId) {
  const { default: axios } = require('axios');
  let openWeatherApiKey;

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.openWeather.start();
   */
  async function start() {
    logger.info('Starting Open Weather service');
    openWeatherApiKey = await gladys.variable.getValue(OPENWEATHER_API_KEY, serviceId);
    if (!openWeatherApiKey) {
      throw new ServiceNotConfiguredError('Open Weather Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.openWeather.stop();
   */
  async function stop() {
    logger.log('stopping Open Weather service');
  }

  /**
   * @description Get the weather.
   * @param {Object} options - Options parameters.
   * @param {number} options.latitude - The latitude to get the weather from.
   * @param {number} options.longitude - The longitude to get the weather from.
   * @param {number} options.offset - Get weather in the future, offset is in hour.
   * @param {string} [options.language] - The language of the report.
   * @param {string} [options.units] - Unit of the weather [auto, si, us].
   * @example
   * gladys.services.openWeather.weather.get({
   *   latitude: 112,
   *   longitude: -2,
   *   offset: 0,
   *   language: 'fr',
   *   units: 'metric',
   * });
   */
  async function get(options) {
    const DEFAULT = {
      language: 'en',
      units: 'metric',
      offset: 0,
    };
    const optionsMerged = Object.assign({}, DEFAULT, options);
    const { latitude, longitude, language, units } = optionsMerged;

    if (!openWeatherApiKey) {
      throw new ServiceNotConfiguredError('Open Weather API Key not found');
    }
    const url = `http://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&lang=${language}&units=${units}&cnt=1&appid=${openWeatherApiKey}`;
    try {
      logger.log(`OpenWeather URL : ${url}`);
      const { data } = await axios.get(url);
      const weatherFormatted = formatResults(optionsMerged, data);
      return weatherFormatted;
    } catch (e) {
      logger.error(e);
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  return Object.freeze({
    start,
    stop,
    weather: {
      get,
    },
  });
};

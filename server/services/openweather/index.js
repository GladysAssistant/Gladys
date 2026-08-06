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
   * @description This function starts the service.
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
   * @description This function stops the service.
   * @example
   * gladys.services.openWeather.stop();
   */
  async function stop() {
    logger.info('Stopping Open Weather service');
  }

  /**
   * @description Merge weather options with their default values.
   * @param {object} options - Options parameters.
   * @returns {object} Options merged with default values.
   * @example
   * const optionsMerged = mergeOptions({ latitude: 112, longitude: -2 });
   */
  function mergeOptions(options) {
    const optionsModified = {
      ...options,
      units: options.units === 'us' ? 'imperial' : 'metric',
    };
    const DEFAULT = {
      language: 'en',
      units: 'metric',
      offset: 0,
    };
    return { ...DEFAULT, ...optionsModified };
  }

  /**
   * @description Fetch the raw OpenWeather current weather and 5-day forecast responses.
   * @param {object} optionsMerged - Options already merged with default values.
   * @returns {Promise<{data: object, forecastData: object}>} Raw OpenWeather API responses.
   * @example
   * const { data, forecastData } = await fetchCurrentAndForecast(optionsMerged);
   */
  async function fetchCurrentAndForecast(optionsMerged) {
    const { latitude, longitude, language, units } = optionsMerged;
    if (!openWeatherApiKey) {
      throw new ServiceNotConfiguredError('Open Weather API Key not found');
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&lang=${language}&units=${units}&cnt=1&appid=${openWeatherApiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&lang=${language}&units=${units}&appid=${openWeatherApiKey}`;
    try {
      logger.log(`OpenWeather URL : ${url}, forecast URL = ${forecastUrl}`);
      const [{ data }, { data: forecastData }] = await Promise.all([axios.get(url), axios.get(forecastUrl)]);
      return { data, forecastData };
    } catch (e) {
      logger.error(e);
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  }

  /**
   * @description Get the weather.
   * @param {object} options - Options parameters.
   * @param {number} options.latitude - The latitude to get the weather from.
   * @param {number} options.longitude - The longitude to get the weather from.
   * @param {number} options.offset - Get weather in the future, offset is in hour.
   * @param {string} [options.language] - The language of the report.
   * @param {string} [options.units] - Unit of the weather [metric, us].
   * @returns {Promise<object>} Resolve with weather.
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
    const optionsMerged = mergeOptions(options);
    const { data, forecastData } = await fetchCurrentAndForecast(optionsMerged);
    return formatResults(optionsMerged, data, forecastData);
  }

  /**
   * @description Get the raw OpenWeather current weather and 5-day forecast responses,
   * for callers that need the original OpenWeather shape instead of the Gladys format.
   * @param {object} options - Options parameters.
   * @param {number} options.latitude - The latitude to get the weather from.
   * @param {number} options.longitude - The longitude to get the weather from.
   * @param {string} [options.language] - The language of the report.
   * @returns {Promise<{data: object, forecastData: object}>} Raw OpenWeather API responses.
   * @example
   * gladys.services.openWeather.weather.getRaw({ latitude: 112, longitude: -2 });
   */
  async function getRaw(options) {
    return fetchCurrentAndForecast(mergeOptions(options));
  }

  return Object.freeze({
    start,
    stop,
    weather: {
      get,
      getRaw,
    },
  });
};

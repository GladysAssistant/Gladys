const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

/**
 * @description Get the weather.
 * @param {object} options - Options parameters.
 * @param {number} options.latitude - The latitude to get the weather from.
 * @param {number} options.longitude - The longitude to get the weather from.
 * @param {number} options.offset - Get weather in the future, offset is in hour.
 * @param {string} [options.language] - The language of the report.
 * @param {string} [options.units] - Units of the weather [auto, si, us].
 * @returns {Promise<object>} Resolve with the weather.
 * @example
 * gladys.weather.get({
 *   latitude: 112,
 *   longitude: -2,
 *   offset: 0,
 *   language: 'fr',
 *   units: 'metric'
 * });
 */
function get(options) {
  const openweatherService = this.service.getService('openweather');
  if (openweatherService === null) {
    throw new ServiceNotConfiguredError(`Service openweather is not found or not configured.`);
  }
  return openweatherService.weather.get(options);
}

module.exports = {
  get,
};

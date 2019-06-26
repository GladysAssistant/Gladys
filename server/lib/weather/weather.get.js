const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

/**
 * @description Get the weather.
 * @param {Object} options - Options parameters.
 * @param {number} options.latitude - The latitude to get the weather from.
 * @param {number} options.longitude - The longitude to get the weather from.
 * @param {number} options.offset - Get weather in the future, offset is in hour.
 * @param {string} [options.language] - The language of the report.
 * @param {string} [options.units] - Units of the weather [auto, si, us].
 * @example
 * gladys.weather.get({
 *   latitude: 112,
 *   longitude: -2,
 *   offset: 0,
 *   language: 'fr',
 *   units: 'si'
 * });
 */
function get(options) {
  const darkSkyService = this.service.getService('darksky');
  if (darkSkyService === null) {
    throw new ServiceNotConfiguredError(`Service darksky is not found or not configured.`);
  }
  return darkSkyService.weather.get(options);
}

module.exports = {
  get,
};

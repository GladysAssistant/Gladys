const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

/**
 * @description Get the weather.
 * @param {Object} options - Options parameters.
 * @param {number} options.latitude - The latitude to get the weather from.
 * @param {number} options.longitude - The longitude to get the weather from.
 * @param {number} [options.offset] - Get weather in the future, offset is in hour.
 * @param {number} [options.datetime] - Get weather at a specified time in the future, time is a timestamp in seconds.
 * @param {string} [options.mode] - Get display mode to return [basic, advanced].
 * @param {string} [options.target] - Get time target for result [currently, hourly, daily].
 * @param {string} [options.language] - The language of the report.
 * @param {string} [options.units] - Unit of the weather [auto, si, us].
 * @example
 * gladys.services.darksky.weather.get({
 *   latitude: 112,
 *   longitude: -2,
 *   offset: 0,
 *   datetime: 1562703427,
 *   language: 'fr',
 *   units: 'si',
 *   mode: 'basic'
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

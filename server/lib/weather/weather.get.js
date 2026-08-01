const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

/**
 * @description Get the weather from the first working weather provider.
 * The core does not know any provider by name: every service in the
 * stateManager exposing `weather.get(options)` — the internal openweather
 * service and external "weather" integrations alike — is a candidate.
 * Candidates are sorted by service name and tried in order, first success
 * wins; a failing candidate (not configured, stopped integration,
 * third-party API down, invalid payload) falls through to the next one.
 * `ext-*` selectors sort before `openweather`, so installing an external
 * weather provider takes precedence with zero configuration, and stopping
 * or uninstalling it falls back to openweather.
 * @param {object} options - Options parameters.
 * @param {number} options.latitude - The latitude to get the weather from.
 * @param {number} options.longitude - The longitude to get the weather from.
 * @param {number} options.offset - Get weather in the future, offset is in hour.
 * @param {string} [options.language] - The language of the report.
 * @param {string} [options.units] - Unit system of the weather [metric, us].
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
async function get(options) {
  const serviceNames = this.service.stateManager.getAllKeys('service');
  const candidates = serviceNames
    .filter((serviceName) => {
      const service = this.service.getService(serviceName);
      return service && service.weather && typeof service.weather.get === 'function';
    })
    .sort();
  if (candidates.length === 0) {
    throw new ServiceNotConfiguredError('No weather provider is installed or configured.');
  }
  // if every provider is merely not configured, the frontend must show its
  // "configure a weather service" call to action; a real failure (a
  // provider exists but is broken) is more actionable and wins
  let firstRealError = null;
  const weather = await Promise.reduce(
    candidates,
    async (result, serviceName) => {
      if (result !== null) {
        return result;
      }
      const service = this.service.getService(serviceName);
      try {
        return await service.weather.get(options);
      } catch (e) {
        logger.debug(`Weather provider ${serviceName} failed`);
        logger.debug(e);
        if (firstRealError === null && !(e instanceof ServiceNotConfiguredError)) {
          firstRealError = e;
        }
        return null;
      }
    },
    null,
  );
  if (weather === null) {
    if (firstRealError !== null) {
      throw firstRealError;
    }
    throw new ServiceNotConfiguredError('No weather provider is installed or configured.');
  }
  return weather;
}

module.exports = {
  get,
};

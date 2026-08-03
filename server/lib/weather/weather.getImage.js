const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { NotFoundError, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

/**
 * @description Get a provider image (B.18 point 6) from the first weather
 * provider exposing `weather.getImage(key)` — the same duck-typed loop as
 * weather.get, so the image comes from the provider that serves the
 * widget. The internal openweather service has no images: only external
 * "weather" integrations are candidates today.
 * @param {string} key - The image key declared in the pivot's images.
 * @returns {Promise<string>} Resolve with the validated data URI.
 * @example
 * const image = await gladys.weather.getImage('vigilance-map');
 */
async function getImage(key) {
  const serviceNames = this.service.stateManager.getAllKeys('service');
  const candidates = serviceNames
    .filter((serviceName) => {
      const service = this.service.getService(serviceName);
      return service && service.weather && typeof service.weather.getImage === 'function';
    })
    .sort();
  let firstRealError = null;
  const image = await Promise.reduce(
    candidates,
    async (result, serviceName) => {
      if (result !== null) {
        return result;
      }
      const service = this.service.getService(serviceName);
      try {
        return await service.weather.getImage(key);
      } catch (e) {
        logger.debug(`Weather provider ${serviceName} failed to serve image ${key}`);
        logger.debug(e);
        if (firstRealError === null) {
          firstRealError = e;
        }
        return null;
      }
    },
    null,
  );
  if (image === null) {
    // an unavailable/invalid image surfaces as the widget's known error;
    // no provider with images at all is a plain not-found
    if (firstRealError instanceof ExternalIntegrationUnavailableError) {
      throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
    if (firstRealError !== null) {
      throw firstRealError;
    }
    throw new NotFoundError(`No weather provider serves the image ${key}.`);
  }
  return image;
}

module.exports = {
  getImage,
};

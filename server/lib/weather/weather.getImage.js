const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { NotFoundError, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { WEATHER_IMAGE_KEY_REGEX } = require('../external-integration/constants');

/**
 * @description Get a provider image (B.18 point 6) from the first weather
 * provider exposing `weather.getImage(key)` — the same duck-typed loop as
 * weather.get, so the image comes from the provider that serves the
 * widget. The internal openweather service has no images: only external
 * "weather" integrations are candidates today.
 * @param {string} key - The image key declared in the pivot's images.
 * @param {string} [serviceName] - Pin a single provider by service name
 * (widget configuration): the image only ever comes from the provider
 * that serves the pinned widget.
 * @returns {Promise<string>} Resolve with the validated data URI.
 * @example
 * const image = await gladys.weather.getImage('vigilance-map');
 */
async function getImage(key, serviceName) {
  // shape gate first: a key that could never be declared (B.18 point 6
  // regex, ≤ 32 chars) 404s before any provider is consulted, and an
  // attacker-sized string never reaches a log line, an error message or
  // a cache key
  if (typeof key !== 'string' || !WEATHER_IMAGE_KEY_REGEX.test(key)) {
    throw new NotFoundError('No weather provider serves this image.');
  }
  const serviceNames = this.service.stateManager.getAllKeys('service');
  let candidates = serviceNames
    .filter((candidateName) => {
      const service = this.service.getService(candidateName);
      return service && service.weather && typeof service.weather.getImage === 'function';
    })
    .sort();
  // same pinning rule as weather.get: a widget pinned to a provider only
  // ever shows the images of that provider
  if (typeof serviceName === 'string' && serviceName.length > 0) {
    candidates = candidates.filter((candidateName) => candidateName === serviceName);
  }
  let firstRealError = null;
  const image = await Promise.reduce(
    candidates,
    async (result, candidateName) => {
      if (result !== null) {
        return result;
      }
      const service = this.service.getService(candidateName);
      try {
        return await service.weather.getImage(key);
      } catch (e) {
        logger.debug(`Weather provider ${candidateName} failed to serve image ${key}`);
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

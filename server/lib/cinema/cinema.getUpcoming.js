const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { ServiceNotConfiguredError, ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');

/**
 * @description Get the upcoming movies from the first working movie provider.
 * The core does not know any provider by name: every service in the
 * stateManager exposing `movies.getUpcoming(options)` — the internal tmdb
 * service and any future movie-data integration alike — is a candidate.
 * Candidates are sorted by service name and tried in order, first success
 * wins; a failing candidate (not configured, third-party API down) falls
 * through to the next one. Same shape as weather.get.
 * @param {object} [options] - Options parameters.
 * @param {string} [options.language] - Gladys UI language (2-letter code, ex. 'fr').
 * @param {string} [options.region] - The region to get theatrical release dates for.
 * @param {number} [options.daysAhead] - How many days ahead to look for releases.
 * @param {string} [options.service] - Pin a single provider by service name
 * (widget configuration): no fallback, its failure is surfaced as-is.
 * @returns {Promise<Array>} Resolve with the list of upcoming movies.
 * @example
 * gladys.cinema.getUpcoming({ language: 'fr', region: 'FR', daysAhead: 30 });
 */
async function getUpcoming(options = {}) {
  const serviceNames = this.service.stateManager.getAllKeys('service');
  let candidates = serviceNames
    .filter((serviceName) => {
      const service = this.service.getService(serviceName);
      return service && service.movies && typeof service.movies.getUpcoming === 'function';
    })
    .sort();
  // a pinned provider (chosen in the widget configuration) is an explicit
  // user choice: the loop shrinks to that single candidate and a failure
  // surfaces instead of silently falling back to another provider
  if (typeof options.service === 'string' && options.service.length > 0) {
    candidates = candidates.filter((serviceName) => serviceName === options.service);
  }
  if (candidates.length === 0) {
    throw new ServiceNotConfiguredError('No movie provider is installed or configured.');
  }
  // if every provider is merely not configured, the frontend must show its
  // "configure a movie integration" call to action; a real failure (a
  // provider exists but is broken) is more actionable and wins
  let firstRealError = null;
  const movies = await Promise.reduce(
    candidates,
    async (result, serviceName) => {
      if (result !== null) {
        return result;
      }
      const service = this.service.getService(serviceName);
      try {
        return await service.movies.getUpcoming(options);
      } catch (e) {
        logger.debug(`Movie provider ${serviceName} failed`);
        logger.debug(e);
        if (firstRealError === null && !(e instanceof ServiceNotConfiguredError)) {
          firstRealError = e;
        }
        return null;
      }
    },
    null,
  );
  if (movies === null) {
    if (firstRealError !== null) {
      // a store movie integration's transport/payload failure (disconnected,
      // ack timeout, invalid payload) surfaces as the standard
      // REQUEST_TO_THIRD_PARTY_FAILED error the widget already maps to its
      // call to action — internal error codes never leak to the user as an
      // opaque "unknown error" (same translation as weather.get)
      if (firstRealError instanceof ExternalIntegrationUnavailableError) {
        throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      }
      throw firstRealError;
    }
    throw new ServiceNotConfiguredError('No movie provider is installed or configured.');
  }
  return movies;
}

module.exports = {
  getUpcoming,
};

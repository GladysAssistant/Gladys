/**
 * @description List the available movie providers: every service in the
 * stateManager exposing `movies.getUpcoming(options)` — the internal tmdb
 * service and any future movie-data integration alike. Same duck-typed
 * enumeration and same order as the provider loop of cinema.getUpcoming.
 * @returns {Array<string>} The service names, in precedence order.
 * @example
 * const providers = gladys.cinema.getProviders();
 */
function getProviders() {
  const serviceNames = this.service.stateManager.getAllKeys('service');
  return serviceNames
    .filter((serviceName) => {
      const service = this.service.getService(serviceName);
      return service && service.movies && typeof service.movies.getUpcoming === 'function';
    })
    .sort();
}

module.exports = {
  getProviders,
};

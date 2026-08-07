/**
 * @description List the available weather providers: every service in the
 * stateManager exposing `weather.get(options)` — the internal openweather
 * service and the installed external "weather" integrations alike. Same
 * duck-typed enumeration and same order as the provider loop of
 * weather.get, so the first name of the list is the provider the
 * automatic mode would pick.
 * @returns {Array<string>} The service names, in precedence order.
 * @example
 * const providers = gladys.weather.getProviders();
 */
function getProviders() {
  const serviceNames = this.service.stateManager.getAllKeys('service');
  return serviceNames
    .filter((serviceName) => {
      const service = this.service.getService(serviceName);
      return service && service.weather && typeof service.weather.get === 'function';
    })
    .sort();
}

module.exports = {
  getProviders,
};

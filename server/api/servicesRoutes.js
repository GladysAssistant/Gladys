const logger = require('../utils/logger');
const asyncMiddleware = require('./middlewares/asyncMiddleware');
/**
 * @description Load all controllers from services.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} router - Router instance.
 * @param {Object} authMiddleware - The authentication Middleware.
 * @example
 * setupServiceRoutes();
 */
function setupServiceRoutes(gladys, router, authMiddleware) {
  logger.debug(`Loading services routes`);
  // get array of services
  const services = Object.entries(gladys.service.getServices());
  // foreach service
  services.forEach((service) => {
    // if the service has a controllers object
    if (service[1].get().controllers) {
      const { controllers } = service[1].get();
      logger.debug(`servicesRoutes: Loading controllers of service "${service[0]}"`);
      // we load each controller
      Object.keys(controllers).forEach((routeKey) => {
        logger.debug(`servicesRoutes: Loading controller "${routeKey}"`);
        // we get the method and path from the route key
        const routeKeySplitted = routeKey.split(' ');
        const method = routeKeySplitted[0];
        const path = routeKeySplitted[1];
        const route = controllers[routeKey];
        // load the authentication middleware if needed
        if (route.authenticated) {
          router[method](path, authMiddleware, asyncMiddleware(route.controller));
        } else {
          router[method](path, asyncMiddleware(route.controller));
        }
      });
    }
  });
}

module.exports = setupServiceRoutes;

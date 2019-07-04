const express = require('express');

// Middlewares
const AuthMiddleware = require('./middlewares/authMiddleware');
const IsInstanceConfiguredMiddleware = require('./middlewares/isInstanceConfigured');
const CorsMiddleware = require('./middlewares/corsMiddleware');
const rateLimitMiddleware = require('./middlewares/rateLimitMiddleware');

// routes
const getRoutes = require('./routes');
const { setupGateway } = require('./setupGateway');

/**
 * @description Setup the routes.
 * @param {Object} gladys - Gladys library.
 * @returns {Object} Express router.
 * @example
 * setupRoutes(gladys);
 */
function setupRoutes(gladys) {
  const router = express.Router();
  const routes = getRoutes(gladys);
  const authMiddleware = AuthMiddleware('dashboard:write', gladys);
  const isInstanceConfiguredMiddleware = IsInstanceConfiguredMiddleware(gladys);
  const resetPasswordAuthMiddleware = AuthMiddleware('reset-password:write', gladys);

  // enable cross origin requests
  router.use(CorsMiddleware);

  // load all internal routes
  const routesKey = Object.keys(routes);
  routesKey.forEach((routeKey) => {
    const splitted = routeKey.split(' ');
    const method = splitted[0];
    const path = splitted[1];
    const routerParams = [];
    // if the route is marked as authenticated
    if (routes[routeKey].authenticated) {
      routerParams.push(authMiddleware);
    }
    // if the route need rate limit
    if (routes[routeKey].rateLimit) {
      routerParams.push(rateLimitMiddleware);
    }
    // if the route need that the instance is not configured
    if (routes[routeKey].instanceNotConfigured) {
      routerParams.push(isInstanceConfiguredMiddleware);
    }
    // if the route need authentication for reset password
    if (routes[routeKey].resetPasswordAuth) {
      routerParams.push(resetPasswordAuthMiddleware);
    }
    // add the controller at the end of the array
    routerParams.push(routes[routeKey].controller);

    // call the router with the params
    router[method](path, ...routerParams);
  });

  setupGateway(gladys, routes);

  return router;
}

module.exports = {
  setupRoutes,
};

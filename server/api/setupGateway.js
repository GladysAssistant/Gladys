const { pathToRegexp } = require('path-to-regexp');

const nodeUrl = require('url');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { EVENTS } = require('../utils/constants');
const { NotFoundError } = require('../utils/coreErrors');

/**
 * @description Setup Gateway API calls.
 * @param {object} gladys - Gladys object.
 * @param {object} routes - List of routes.
 * @example
 * setupGateway(gladys, app);
 */
function setupGateway(gladys, routes) {
  // we build an array of regexes foreach available route
  const routesKeys = Object.keys(routes);
  const regexes = routesKeys.map((routeKey) => {
    const method = routeKey.split(' ')[0];
    const path = routeKey.split(' ')[1];
    const keys = [];
    return {
      method,
      keys,
      regex: pathToRegexp(path, keys),
      controller: routes[routeKey].controller,
    };
  });
  gladys.event.on(EVENTS.GATEWAY.NEW_MESSAGE_API_CALL, (user, method, url, query, body, cb) => {
    // we parse the URL to remove potential GET params
    const urlParsed = nodeUrl.parse(url, true);
    // we construct the req object sent to the controller
    const req = {
      user,
      method: method.toLowerCase(),
      url: urlParsed.pathname, // get only the path, without get params
      query: { ...query, ...urlParsed.query }, // merge query/get params
      body,
      params: {},
    };
    const res = {
      send: cb,
      json: cb,
      status: () => res,
    };
    let found = false;
    let results;
    let i = 0;
    // we try to see if a route match
    while (!found && i < regexes.length) {
      results = regexes[i].regex.exec(req.url);
      found = results !== null && req.method === regexes[i].method;
      i += 1;
    }
    // if a route match
    if (found) {
      // we build the req.params object
      regexes[i - 1].keys.forEach((key, index) => {
        req.params[key.name] = results[index + 1];
      });
      // and we call the controller
      regexes[i - 1].controller(req, res, (e) => {
        errorMiddleware(e, req, res);
      });
    } else {
      // if not, we contact the error middleware with a not found error
      errorMiddleware(new NotFoundError(`Route ${req.url} not found`), req, res);
    }
  });
}

module.exports = {
  setupGateway,
};

const pathToRegexp = require('path-to-regexp');

const nodeUrl = require('url');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { EVENTS } = require('../utils/constants');
const { NotFoundError } = require('../utils/coreErrors');

/**
 * @description Setup Gateway API calls
 * @param {Object} gladys - Gladys object.
 * @param {Object} routes - List of routes.
 * @example
 * setupGateway(gladys, app);
 */
function setupGateway(gladys, routes) {
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
    const urlParsed = nodeUrl.parse(url, true);
    const req = {
      user,
      method: method.toLowerCase(),
      url: urlParsed.pathname,
      query: Object.assign({}, query, urlParsed.query),
      body,
      params: {},
    };
    const res = {
      send: cb,
      json: cb,
      status: () => res,
    };
    try {
      let found = false;
      let results;
      let i = 0;
      while (!found && i < regexes.length) {
        results = regexes[i].regex.exec(req.url);
        found = results !== null && req.method === regexes[i].method;
        i += 1;
      }
      if (!found) {
        return errorMiddleware(new NotFoundError(`Route ${req.url} not found`), req, res);
      }
      regexes[i - 1].keys.forEach((key, index) => {
        req.params[key.name] = results[index + 1];
      });
      console.log(req.params);
      regexes[i - 1].controller(req, res, (e) => {
        errorMiddleware(e, req, res);
      });
    } catch (e) {
      console.log(e);
    }
  });
}

module.exports = {
  setupGateway,
};

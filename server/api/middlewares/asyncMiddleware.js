const Promise = require('bluebird');

const asyncMiddleware = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncMiddleware;

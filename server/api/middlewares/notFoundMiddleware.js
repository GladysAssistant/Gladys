const { Error404 } = require('../../utils/httpErrors');

module.exports = function notFoundMiddleware(req, res, next) {
  throw new Error404(`Route ${req.path} not found`);
};

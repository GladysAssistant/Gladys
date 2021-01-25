const { Error401 } = require('../../utils/httpErrors');
const { USER_ROLE } = require('../../utils/constants');

module.exports = function adminMiddleware(req, res, next) {
  if (req.user && req.user.role === USER_ROLE.ADMIN) {
    next();
  } else {
    throw new Error401('This route is only accessible to admin user.');
  }
};

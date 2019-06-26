const asyncMiddleware = require('./asyncMiddleware');
const { Error403 } = require('../../utils/httpErrors');

module.exports = function IsInstanceConfiguredMiddleware(gladys) {
  return asyncMiddleware(async (req, res, next) => {
    const numberOfUsers = gladys.user.getUserCount();
    if (numberOfUsers === 0) {
      next();
    } else {
      throw new Error403('INSTANCE_ALREADY_CONFIGURED');
    }
  });
};

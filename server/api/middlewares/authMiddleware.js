const asyncMiddleware = require('./asyncMiddleware');
const { Error401 } = require('../../utils/httpErrors');

module.exports = function AuthMiddleware(scope, gladys) {
  return asyncMiddleware(async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      let userId;

      // if it's an access token
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        // we validate the token
        const payload = gladys.session.validateAccessToken(token, scope);
        userId = payload.user_id;
        req.session_id = payload.session_id;
      } else if (authHeader || req.body.api_key || req.query.api_key) {
        const token = authHeader || req.body.api_key || req.query.api_key;
        // we validate the token
        userId = await gladys.session.validateApiKey(token, scope);
      } else {
        throw new Error401('No authorization header or api key found');
      }

      // we get the user in DB
      req.user = await gladys.user.getById(userId);

      next();
    } catch (e) {
      if (e instanceof Error401) {
        throw e;
      }
      throw new Error401();
    }
  });
};

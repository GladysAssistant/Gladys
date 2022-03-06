const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { OAUTH2 } = require('../../utils/constants');

module.exports = function OAuth2Controller(gladys) {
  /**
   * @description Build an authorization uri (to get authorizationcode).
   * @api {post} /api/v1/service/oauth2/client/authorization-uri Build an authorization uri (to get authorizationcode)
   * @apiName BuildAuthorizationUri
   * @apiGroup OAuth2
   */
  async function buildAuthorizationUri(req, res) {
    if (
      req.body &&
      req.body.service_id &&
      req.user &&
      req.user.id &&
      req.body.integration_name &&
      req.headers.referer
    ) {
      const authorizationUriResult = await gladys.oauth2Client.buildAuthorizationUri(
        req.body.service_id,
        req.user.id,
        req.body.integration_name,
        req.headers.referer,
      );

      res.json({
        authorizationUri: authorizationUriResult,
      });
    }
  }

  /**
   * @description Get access token and save it in database (for current service).
   * @api {post} /api/v1/service/oauth2/client/access-token Build an getToken uri (to get token access)
   * @apiName buildAccesTokenUri
   * @apiGroup OAuth2
   */
  async function getAccesTokenUri(req, res) {
    if (
      req.body &&
      req.body.service_id &&
      req.user &&
      req.user.id &&
      req.body.authorization_code &&
      req.headers.referer
    ) {
      const authResult = await gladys.oauth2Client.getAccesToken(
        req.body.service_id,
        req.user.id,
        req.body.authorization_code,
        req.headers.referer,
      );
      res.json({
        result: authResult,
      });
    }
  }

  /**
   * @description Return the current integration config.
   * @api {get} /api/v1/service/oauth2/client Return the current integration config.
   * @apiName getCurrentConfig
   * @apiGroup oauth2
   */
  async function getCurrentConfig(req, res) {
    if (req.query && req.query.service_id && req.user && req.user.id) {
      const serviceId = req.query.service_id;

      const resultClientId = await gladys.variable.getValue(OAUTH2.VARIABLE.CLIENT_ID, serviceId, req.user.id);

      res.json({
        client_id: resultClientId,
      });
    }
  }

  return Object.freeze({
    buildAuthorizationUri: asyncMiddleware(buildAuthorizationUri),
    getAccesTokenUri: asyncMiddleware(getAccesTokenUri),
    getCurrentConfig: asyncMiddleware(getCurrentConfig),
  });
};

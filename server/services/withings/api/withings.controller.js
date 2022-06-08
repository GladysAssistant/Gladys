const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { OAUTH2 } = require('../../../utils/constants');

module.exports = function WithingsController(gladys, withingsHandler) {
  /**
   * @description Init gladys devices with withings devices.
   * @api {post} /api/v1/service/withings/init_devices Init gladys devices with withings devices.
   * @apiName init
   * @apiGroup Withings
   */
  async function init(req, res) {
    const resultInit = await withingsHandler.initDevices(req.user.id);
    res.json({
      withingsDevices: resultInit,
    });
  }

  /**
   * @description Delete client id, secret client of withings oauth2 api and al withings devices.
   * @api {get} /api/v1/service/withings/reset Delete clientId and secret of withings oauth2 api.
   * @apiName reset
   * @apiGroup Withings
   */
  async function reset(req, res) {
    await withingsHandler.deleteVar(req.user.id);
    await withingsHandler.deleteDevices();
    res.json({
      success: true,
    });
  }

  /**
   * @description Build an authorization uri (to get authorizationcode).
   * @api {post} /api/v1/service/withings/oauth2/client/authorization-uri Build an authorization uri
   * @apiName BuildAuthorizationUri
   * @apiGroup OAuth2
   */
  async function buildAuthorizationUri(req, res) {
    if (req.body && req.body.service_id && req.body.integration_name && req.headers.referer) {
      const authorizationUriResult = await withingsHandler.oauth2Client.buildAuthorizationUri(
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
   * @api {post} /api/v1/service/withings/oauth2/client/access-token Build an getToken uri (to get token access)
   * @apiName buildAccessTokenUri
   * @apiGroup OAuth2
   */
  async function getAccessTokenUri(req, res) {
    if (req.body && req.body.service_id && req.body.authorization_code && req.headers.referer) {
      const authResult = await withingsHandler.oauth2Client.getAccessToken(
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
   * @api {get} /api/v1/service/withings/oauth2/client Return the current integration config.
   * @apiName getCurrentConfig
   * @apiGroup oauth2
   */
  async function getCurrentConfig(req, res) {
    if (req.query && req.query.service_id) {
      const serviceId = req.query.service_id;

      const resultClientId = await gladys.variable.getValue(OAUTH2.VARIABLE.CLIENT_ID, serviceId, req.user.id);

      const resultAccessToken = await gladys.variable.getValue(OAUTH2.VARIABLE.ACCESS_TOKEN, serviceId, req.user.id);

      // If access_token does not exist and client_id exist
      // => connect process is not complete: remove variable already saved
      // => force restart connect process from beginning
      if (resultClientId && !resultAccessToken) {
        await gladys.variable.destroy(OAUTH2.VARIABLE.CLIENT_ID, serviceId, req.user.id);
        await gladys.variable.destroy(OAUTH2.VARIABLE.CLIENT_SECRET, serviceId, req.user.id);
      }

      res.json({
        client_id: resultClientId,
      });
    }
  }

  return {
    'post /api/v1/service/withings/init_devices': {
      authenticated: true,
      controller: asyncMiddleware(init),
    },
    'get /api/v1/service/withings/reset': {
      authenticated: true,
      controller: asyncMiddleware(reset),
    },
    // oauth2
    'post /api/v1/service/withings/oauth2/client/authorization-uri': {
      authenticated: true,
      controller: asyncMiddleware(buildAuthorizationUri),
    },
    'post /api/v1/service/withings/oauth2/client/access-token': {
      authenticated: true,
      controller: asyncMiddleware(getAccessTokenUri),
    },
    'get /api/v1/service/withings/oauth2/client': {
      authenticated: true,
      controller: asyncMiddleware(getCurrentConfig),
    },
  };
};

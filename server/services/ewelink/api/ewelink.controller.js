const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EwelinkController(eweLinkHandler) {
  /**
   * @api {get} /api/v1/service/ewelink/config Get eWeLink application configuration.
   * @apiName getConfig
   * @apiGroup Ewelink
   */
  function getConfig(req, res) {
    const { applicationId, applicationSecret, applicationRegion } = eweLinkHandler.configuration;
    res.json({
      application_id: applicationId,
      application_secret: applicationSecret,
      application_region: applicationRegion,
    });
  }

  /**
   * @api {post} /api/v1/service/ewelink/config Save eWeLink application configuration.
   * @apiName saveConfig
   * @apiGroup Ewelink
   */
  async function saveConfig(req, res) {
    const {
      application_id: applicationId,
      application_secret: applicationSecret,
      application_region: applicationRegion,
    } = req.body;

    await eweLinkHandler.saveConfiguration({
      applicationId,
      applicationSecret,
      applicationRegion,
    });

    getConfig(req, res);
  }

  /**
   * @api {get} /api/v1/service/ewelink/loginUrl Gets the eWelink login URL.
   * @apiName loginUrl
   * @apiGroup Ewelink
   */
  async function loginUrl(req, res) {
    const { redirect_url: redirectUrl } = req.query;
    const ewelinkLoginUrl = await eweLinkHandler.buildLoginUrl({
      redirectUrl,
    });
    res.json({ login_url: ewelinkLoginUrl });
  }

  /**
   * @api {post} /api/v1/service/ewelink/token Generates a user token.
   * @apiName exchangeToken
   * @apiGroup Ewelink
   */
  async function exchangeToken(req, res) {
    const { redirect_url: redirectUrl, code, region, state } = req.body;
    await eweLinkHandler.exchangeToken({
      redirectUrl,
      code,
      region,
      state,
    });
    res.json({ success: true });
  }

  /**
   * @api {delete} /api/v1/service/ewelink/token Delete stored tokens and logout user.
   * @apiName deleteTokens
   * @apiGroup Ewelink
   */
  async function deleteTokens(req, res) {
    await eweLinkHandler.deleteTokens();
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/service/ewelink/status Get eWeLink connection status.
   * @apiName status
   * @apiGroup Ewelink
   */
  async function status(req, res) {
    const response = eweLinkHandler.getStatus();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/ewelink/discover Retrieve eWelink devices from cloud.
   * @apiName discover
   * @apiGroup Ewelink
   */
  async function discover(req, res) {
    const devices = await eweLinkHandler.discover();
    res.json(devices);
  }

  return {
    'get /api/v1/service/ewelink/config': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getConfig),
    },
    'post /api/v1/service/ewelink/config': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(saveConfig),
    },
    'get /api/v1/service/ewelink/loginUrl': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(loginUrl),
    },
    'post /api/v1/service/ewelink/token': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(exchangeToken),
    },
    'delete /api/v1/service/ewelink/token': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(deleteTokens),
    },
    'get /api/v1/service/ewelink/status': {
      authenticated: true,
      controller: status,
    },
    'get /api/v1/service/ewelink/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};

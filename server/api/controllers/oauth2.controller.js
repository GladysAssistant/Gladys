const oauth2 = require('simple-oauth2');
const logger = require('../../utils/logger');
const asyncMiddleware = require('../middlewares/asyncMiddleware');
const providers = require('../../config/oauth2/providers.json');

module.exports = function OAuth2Controller(gladys) {
  /**
   * @api {post} /api/v1/service/oauth2/buildAuthorizationUri Build an authorization uri (to get authorizationcode)
   * @apiName BuildAuthorizationUri
   * @apiGroup OAuth2
   */
  async function buildAuthorizationUri(req, res) {
    // Find provider configuration
    const currentProvider = providers[req.body.integrationName];
    const { tokenHost } = currentProvider;
    const { authorizeHost } = currentProvider;
    const { authorizePath } = currentProvider;
    const { integrationScope } = currentProvider;
    logger.debug(currentProvider);

    // Get variale client_id and secret_id
    const clientId = await gladys.variable.getValue(
      `${req.body.integrationName.toUpperCase()}_CLIENT_ID`,
      req.body.serviceId,
    );
    const secretId = await gladys.variable.getValue(
      `${req.body.integrationName.toUpperCase()}_SECRET_ID`,
      req.body.serviceId,
    );

    // Init credentials based on integration name
    const credentials = {
      client: {
        id: clientId,
        secret: secretId,
      },
      auth: {
        tokenHost,
        authorizeHost,
        authorizePath,
      },
    };

    const oauth2Instance = await oauth2.create(credentials);

    const authorizationUriResult = await oauth2Instance.authorizationCode.authorizeURL({
      redirect_uri: req.headers.referer,
      scope: integrationScope,
      state: `gladys_state_${req.body.integrationName}`,
    });

    res.json({
      success: true,
      authorizationUri: authorizationUriResult,
    });
  }

  /**
   * @api {post} /api/v1/service/oauth2/buildTokenAccessUri Build an getToken uri (to get token access)
   * @apiName buildTokenAccessUri
   * @apiGroup OAuth2
   */
  async function buildTokenAccessUri(req, res) {
    // Find provider configuration
    const currentProvider = providers[req.body.integrationName];
    const { tokenHost } = currentProvider;
    const { tokenPath } = currentProvider;
    const { authorizeHost } = currentProvider;
    const { authorizePath } = currentProvider;
    const { grantType } = currentProvider;

    const { authorizationCode } = req.body;

    const clientId = await gladys.variable.getValue(
      `${req.body.integrationName.toUpperCase()}_CLIENT_ID`,
      req.body.serviceId,
    );
    const secretId = await gladys.variable.getValue(
      `${req.body.integrationName.toUpperCase()}_SECRET_ID`,
      req.body.serviceId,
    );

    // Init credentials based on integration name
    const credentials = {
      client: {
        id: clientId,
        secret: secretId,
      },
      auth: {
        tokenHost,
        tokenPath,
        authorizeHost,
        authorizePath,
      },
    };
    // Build token access request
    const tokenConfig = {
      code: authorizationCode,
      client_id: clientId,
      client_secret: secretId,
      grant_type: grantType,
      redirect_uri: req.headers.referer.substring(0, req.headers.referer.indexOf('?')),
    };

    try {
      const oauth2Instance = await oauth2.create(credentials);
      const authResult = await oauth2Instance.authorizationCode.getToken(tokenConfig, { json: true });

      res.json({
        success: true,
        result: authResult,
      });
    } catch (error) {
      logger.error(error);

      res.json({
        success: false,
        result: error.message,
      });
    }
  }

  /**
   * @description Return the current integration config.
   * @api {get} /api/v1/service/oauth2/getCurrentConfig Return the current integration config.
   * @apiName getCurrentConfig
   * @apiGroup oauth2
   */
  async function getCurrentConfig(req, res) {
    const { integrationName } = req.query;
    const { serviceId } = req.query;

    const resultClientId = await gladys.variable.getValue(`${integrationName.toUpperCase()}_CLIENT_ID`, serviceId);

    res.json({
      success: true,
      clientId: resultClientId,
    });
  }

  return Object.freeze({
    buildAuthorizationUri: asyncMiddleware(buildAuthorizationUri),
    buildTokenAccessUri: asyncMiddleware(buildTokenAccessUri),
    getCurrentConfig: asyncMiddleware(getCurrentConfig),
  });
};

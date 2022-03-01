const { AuthorizationCode } = require('simple-oauth2');
const logger = require('../../utils/logger');
const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { OAUTH2 } = require('../../utils/constants');
const { Error500 } = require('../../utils/httpErrors');

module.exports = function OAuth2Controller(gladys) {
  /**
   * @description Build an authorization uri (to get authorizationcode).
   * @api {post} /api/v1/service/oauth2/client/authorization-uri Build an authorization uri (to get authorizationcode)
   * @apiName BuildAuthorizationUri
   * @apiGroup OAuth2
   */
  async function buildAuthorizationUri(req, res) {
    // Find provider configuration
    const tokenHost = await gladys.variable.getValue(`${OAUTH2.VARIABLE.TOKEN_HOST}`, req.body.serviceId);
    const authorizeHost = await gladys.variable.getValue(`${OAUTH2.VARIABLE.AUTHORIZE_HOST}`, req.body.serviceId);
    const authorizePath = await gladys.variable.getValue(`${OAUTH2.VARIABLE.AUTHORIZE_PATH}`, req.body.serviceId);
    const integrationScope = await gladys.variable.getValue(`${OAUTH2.VARIABLE.INTEGRATION_SCOPE}`, req.body.serviceId);
    const redirectUriSuffix = await gladys.variable.getValue(
      `${OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX}`,
      req.body.serviceId,
    );

    // Get variale client id and client secret
    const clientId = await gladys.variable.getValue(`${OAUTH2.VARIABLE.CLIENT_ID}`, req.body.serviceId, req.user.id);
    const secret = await gladys.variable.getValue(`${OAUTH2.VARIABLE.CLIENT_SECRET}`, req.body.serviceId, req.user.id);

    // Init credentials based on integration name
    const credentials = {
      client: {
        id: clientId,
        secret,
      },
      auth: {
        tokenHost,
        authorizeHost,
        authorizePath,
      },
    };

    const client = new AuthorizationCode(credentials);
    const authorizationUriResult = await client.authorizeURL({
      redirect_uri: `${req.headers.referer}${redirectUriSuffix}`,
      scope: integrationScope,
      state: `gladys_state_${req.body.integrationName}`,
    });

    res.json({
      authorizationUri: authorizationUriResult,
    });
  }

  /**
   * @description Build an authorization uri to get an access token.
   * @api {post} /api/v1/service/oauth2/client/access-token-uri Build an getToken uri (to get token access)
   * @apiName buildAccesTokenUri
   * @apiGroup OAuth2
   */
  async function buildAccesTokenUri(req, res) {
    // Find provider configuration
    const tokenHost = await gladys.variable.getValue(`${OAUTH2.VARIABLE.TOKEN_HOST}`, req.body.serviceId);
    const tokenPath = await gladys.variable.getValue(`${OAUTH2.VARIABLE.TOKEN_PATH}`, req.body.serviceId);
    const authorizeHost = await gladys.variable.getValue(`${OAUTH2.VARIABLE.AUTHORIZE_HOST}`, req.body.serviceId);
    const authorizePath = await gladys.variable.getValue(`${OAUTH2.VARIABLE.AUTHORIZE_PATH}`, req.body.serviceId);
    const grantType = await gladys.variable.getValue(`${OAUTH2.VARIABLE.GRANT_TYPE}`, req.body.serviceId);
    const additionalAccesTokenRequestAxtionParam = await gladys.variable.getValue(
      `${OAUTH2.VARIABLE.ADDITIONAL_ACCESS_TOKEN_REQUEST_ACTION_PARAM}`,
      req.body.serviceId,
    );
    const redirectUriSuffix = await gladys.variable.getValue(
      `${OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX}`,
      req.body.serviceId,
    );

    const { authorizationCode } = req.body;

    const clientId = await gladys.variable.getValue(`${OAUTH2.VARIABLE.CLIENT_ID}`, req.body.serviceId, req.user.id);
    const secret = await gladys.variable.getValue(`${OAUTH2.VARIABLE.CLIENT_SECRET}`, req.body.serviceId, req.user.id);

    // Init credentials based on integration name
    const credentials = {
      client: {
        id: clientId,
        secret,
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
      client_secret: secret,
      grant_type: grantType,
      redirect_uri: `${req.headers.referer}${redirectUriSuffix}`,
    };
    if (additionalAccesTokenRequestAxtionParam) {
      tokenConfig.action = additionalAccesTokenRequestAxtionParam;
    }

    try {
      const client = new AuthorizationCode(credentials);
      const authResult = await client.getToken(tokenConfig, { json: true });

      if (authResult.token) {
        if (authResult.token.status && authResult.token.status !== 0) {
          throw new Error500('Oauth2 get token response is not with status 0');
        }

        let jsonResult;
        if (authResult.token.body) {
          jsonResult = JSON.stringify(authResult.token.body);
        } else {
          jsonResult = JSON.stringify(authResult.token);
        }

        // Save accessToken
        await gladys.variable.setValue(`${OAUTH2.VARIABLE.ACCESS_TOKEN}`, jsonResult, req.body.serviceId, req.user.id);

        res.json({
          result: authResult,
        });
      }
    } catch (error) {
      await gladys.variable.destroy(`${OAUTH2.VARIABLE.CLIENT_ID}`, req.body.serviceId, req.user.id);
      await gladys.variable.destroy(`${OAUTH2.VARIABLE.CLIENT_SECRET}`, req.body.serviceId, req.user.id);
      logger.error(error);
      throw new Error500(error);
    }
  }

  /**
   * @description Return the current integration config.
   * @api {get} /api/v1/service/oauth2/client Return the current integration config.
   * @apiName getCurrentConfig
   * @apiGroup oauth2
   */
  async function getCurrentConfig(req, res) {
    const { serviceId } = req.query;

    const resultClientId = await gladys.variable.getValue(`${OAUTH2.VARIABLE.CLIENT_ID}`, serviceId, req.user.id);

    res.json({
      clientId: resultClientId,
    });
  }

  return Object.freeze({
    buildAuthorizationUri: asyncMiddleware(buildAuthorizationUri),
    buildAccesTokenUri: asyncMiddleware(buildAccesTokenUri),
    getCurrentConfig: asyncMiddleware(getCurrentConfig),
  });
};

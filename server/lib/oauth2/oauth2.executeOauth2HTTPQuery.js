const queryString = require('query-string');
const { ClientCredentials } = require('simple-oauth2');
const { default: axios } = require('axios');
const logger = require('../../utils/logger');
const { OAUTH2 } = require('../../utils/constants');

/**
 * @description Refresh Oauth2 token in case of it expired .
 * @param {string} serviceId - Gladys service id call method.
 * @param {Object} gladys - Current gladys instance.
 * @param {string} userId - Gladys userId of current session.
 * @returns {Object} Response of oauth2 refresh token query .
 * @example
 * oauth2.refreshTokenAccess('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85',
 *    {...}, '78v4f3df83g74v1fsd8375f63gvrf5c');
 */
async function refreshTokenAccess(serviceId, gladys, userId) {
  const clientId = await gladys.variable.getValue(OAUTH2.VARIABLE.CLIENT_ID, serviceId, userId);
  const secret = await gladys.variable.getValue(OAUTH2.VARIABLE.CLIENT_SECRET, serviceId, userId);
  const accessToken = JSON.parse(await gladys.variable.getValue(OAUTH2.VARIABLE.ACCESS_TOKEN, serviceId, userId));

  logger.trace('accessToken: ', accessToken);
  // Find provider configuration
  const tokenHost = await gladys.variable.getValue(OAUTH2.VARIABLE.TOKEN_HOST, serviceId);
  const tokenPath = await gladys.variable.getValue(OAUTH2.VARIABLE.TOKEN_PATH, serviceId);
  const authorizeHost = await gladys.variable.getValue(OAUTH2.VARIABLE.AUTHORIZE_HOST, serviceId);
  const authorizePath = await gladys.variable.getValue(OAUTH2.VARIABLE.AUTHORIZE_PATH, serviceId);
  const integrationScope = await gladys.variable.getValue(`${OAUTH2.VARIABLE.INTEGRATION_SCOPE}`, serviceId);

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
    http: {
      json: true,
    },
  };

  try {
    const client = new ClientCredentials(credentials);
    let authResult = await client.createToken(accessToken);

    if (authResult.expired()) {
      logger.trace('Refresh token is requiered');
      // Refresh token
      try {
        const refreshParams = {
          client_id: clientId,
          client_secret: secret,
          scope: integrationScope,
        };

        authResult = await authResult.refresh(refreshParams);

        // Save new  accessToken
        await gladys.variable.setValue(
          OAUTH2.VARIABLE.ACCESS_TOKEN,
          JSON.stringify(authResult),
          serviceId,
          userId,
        );
      } catch (error) {
        logger.error('Error refreshing access token: ', error);
      }
    }

    logger.trace('authResult: ', authResult);
    return authResult;
  } catch (error) {
    logger.error(error);
    return null;
  }
}

/**
 * @description Execute a query to Oauth2 API.
 * @param {string} serviceId - Gladys service id call method.
 * @param {string} userId - Gladys userId of current session.
 * @param {string} queryType - Method of call ('get' or 'post').
 * @param {string} queryUrl - Url to send query.
 * @param {string} queryParams - Array of query params.
 * @returns {Promise} Result of query .
 * @example
 * oauth2.executeOauth2HTTPQuery('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85', '78v4f3df83g74v1fsd8375f63gvrf5c', 'withings'
 *  'Bearer', 'get', 'http://localhost/apiname',[...]);
 */
async function executeOauth2HTTPQuery(serviceId, userId, queryType, queryUrl, queryParams) {
  // Refresh token access if needed
  const accesToken = await refreshTokenAccess(serviceId, this.gladys, userId);

  const headerConfig = {
    headers: {
      Authorization: `${accesToken.token.token_type} ${accesToken.token.access_token}`,
    },
  };

  try {
    let result;
    if (queryType === 'get' || queryType === 'GET' || queryType === 'Get') {
      // Add param in query
      result = await axios.get(`${queryUrl}?${queryParams}`, headerConfig);
    } else {
      // Add param to body
      const data = {};
      const queryParamsExtract = queryString.parse(queryParams);
      Object.keys(queryParamsExtract).forEach((key) => {
        logger.debug(key, queryParamsExtract[key]);
        data[key] = queryParamsExtract[key];
      });

      result = await axios.post(queryUrl, data, headerConfig);
    }

    return result;
  } catch (error) {
    logger.error('Execute query error: ', error.message);
    return null;
  }
}

module.exports = {
  executeOauth2HTTPQuery,
};

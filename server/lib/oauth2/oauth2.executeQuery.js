const queryString = require('query-string');
const { ClientCredentials } = require('simple-oauth2');
const { default: axios } = require('axios');
const logger = require('../../utils/logger');
const providers = require('../../config/oauth2/providers.json');

/**
 * @description Refresh Oauth2 token in case of it expired .
 * @param {string} serviceId - Gladys service id call method.
 * @param {string} integrationName - Name of oauth2 integration.
 * @param {Object} gladys - Current gladys instance.
 * @param {string} userId - Gladys userId of current session.
 * @returns {Object} Response of oauth2 refresh token query .
 * @example
 * oauth2.refreshTokenAccess('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85',
 *    'withings', {...}, '78v4f3df83g74v1fsd8375f63gvrf5c');
 */
async function refreshTokenAccess(serviceId, integrationName, gladys, userId) {
  const clientId = await gladys.variable.getValue(`${integrationName.toUpperCase()}_CLIENT_ID`, serviceId, userId);
  const secretId = await gladys.variable.getValue(`${integrationName.toUpperCase()}_SECRET_ID`, serviceId, userId);
  const accessToken = JSON.parse(
    await gladys.variable.getValue(`${integrationName.toUpperCase()}_ACCESS_TOKEN`, serviceId, userId),
  );

  logger.trace('accessToken: ', accessToken);
  // Find provider configuration
  const currentProvider = providers[integrationName];
  const { tokenHost } = currentProvider;
  const { tokenPath } = currentProvider;
  const { authorizeHost } = currentProvider;
  const { authorizePath } = currentProvider;
  const { integrationScope } = currentProvider;

  // Init credentials based on integration name
  const credentials = {
    client: {
      id: `${clientId}`,
      secret: `${secretId}`,
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
          client_secret: secretId,
          scope: integrationScope,
        };

        authResult = await authResult.refresh(refreshParams);

        // Save new  accessToken
        await gladys.variable.setValue(
          `${integrationName.toUpperCase()}_ACCESS_TOKEN`,
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
 * @param {string} integrationName - Oauth2 integration name.
 * @param {string} queryType - Method of call ('get' or 'post').
 * @param {string} queryUrl - Url to send query.
 * @param {string} queryParams - Array of query params.
 * @returns {Promise} Result of query .
 * @example
 * oauth2.executeQuery('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85', '78v4f3df83g74v1fsd8375f63gvrf5c', 'withings'
 *  'Bearer', 'get', 'http://localhost/apiname',[...]);
 */
async function executeQuery(serviceId, userId, integrationName, queryType, queryUrl, queryParams) {
  // Refresh token access if needed
  const accesToken = await refreshTokenAccess(serviceId, integrationName, this.gladys, userId);

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
      Object.keys(queryParamsExtract).forEach(function parseQueryParams(key) {
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
  executeQuery,
};

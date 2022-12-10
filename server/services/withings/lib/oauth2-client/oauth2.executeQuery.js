const queryString = require('query-string');
const { default: axios } = require('axios');
const { ClientCredentials } = require('simple-oauth2');
const logger = require('../../../../utils/logger');
const { OAUTH2 } = require('./utils/constants.js');

/**
 *
 * @description Refresh Oauth2 token in case of it expired .
 * @param {Object} variable - Gladys variable manager.
 * @param {string} serviceId - Gladys service id call method.
 * @param {string} userId - Gladys userId of current session.
 * @param {string} tokenHost - Token host url.
 * @param {string} tokenPath - Token path.
 * @param {string} additionalAccessTokenRequestActionParam - Additional action parameter.
 * @returns {Object} Response of oauth2 refresh token query .
 * @example
 * oauth2.refreshTokenAccess('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85',
 *    {...}, '78v4f3df83g74v1fsd8375f63gvrf5c',
 *    'http://localhost:9292', '/token', 'http://localhost:9292', '/authorize2');
 */
async function refreshTokenAccess(
  variable,
  serviceId,
  userId,
  tokenHost,
  tokenPath,
  additionalAccessTokenRequestActionParam,
) {
  const clientId = await variable.getValue(OAUTH2.VARIABLE.CLIENT_ID, serviceId, userId);
  const secret = await variable.getValue(OAUTH2.VARIABLE.CLIENT_SECRET, serviceId, userId);
  const accessToken = JSON.parse(await variable.getValue(OAUTH2.VARIABLE.ACCESS_TOKEN, serviceId, userId));

  logger.trace('accessToken: ', accessToken);

  // Init credentials based on integration name
  const credentials = {
    client: {
      id: clientId,
      secret,
    },
    auth: {
      tokenHost,
      tokenPath,
    },
    http: {
      json: true,
    },
  };

  try {
    const client = new ClientCredentials(credentials);
    let authResult = await client.createToken(accessToken);

    if (authResult.expired()) {
      logger.trace('Refresh token is required');
      // Refresh token
      try {
        const refreshParams = {
          client_id: clientId,
          client_secret: secret,
          grant_type: 'refresh_token',
          refresh_token: authResult.token.refresh_token,
          action: additionalAccessTokenRequestActionParam,
        };

        authResult = await authResult.refresh(refreshParams);

        // Save new  accessToken
        if (!authResult.token.status || authResult.token.status === 0) {
          let jsonResult;
          if (authResult.token.body) {
            jsonResult = authResult.token.body;
            authResult = await client.createToken(jsonResult);
          } else {
            jsonResult = authResult.token;
          }
          await variable.setValue(OAUTH2.VARIABLE.ACCESS_TOKEN, JSON.stringify(jsonResult), serviceId, userId);
        }
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
 * oauth2.executeQuery('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85', '78v4f3df83g74v1fsd8375f63gvrf5c', 'withings'
 *  'Bearer', 'get', 'http://localhost/apiname',[...]);
 */
async function executeQuery(serviceId, userId, queryType, queryUrl, queryParams) {
  // Refresh token access if needed
  const accessToken = await refreshTokenAccess(
    this.variable,
    serviceId,
    userId,
    this.tokenHost,
    this.tokenPath,
    this.additionalAccessTokenRequestActionParam,
  );

  const headerConfig = {
    headers: {
      Authorization: `${accessToken.token.token_type} ${accessToken.token.access_token}`,
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
  executeQuery,
};

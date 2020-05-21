const queryString = require('query-string');
const { default: axios } = require('axios');
const logger = require('../../utils/logger');
// const providers = require('../../config/oauth2/providers.json')

/**
 * @description Refresh Oauth2 token in case of it expired .
 * @param {string} clientId - Client_id of oauth2.
 * @param {string} clientSecret - Secret_id of oauth2.
 * @param {string} refreshToken - Refresh token of oauth2.
 * @returns {Object} Response of oauth2 refresh token query .
 * @example
 * oauth2.refreshTokenAccess('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85',
 *    '78v4f3df83g74v1fsd8375f63gvrf5c', '78v4f3df83g74v1fsd8375f63gvrf5c');
 */
function refreshTokenAccess(clientId, clientSecret, refreshToken) {
  // grant_type = refresh_token
  logger.debug(clientId);
  logger.debug(clientSecret);
  logger.debug(refreshToken);
  return null;
}

/**
 * @description Execute a query to Oauth2 API.
 * @param {string} accessToken - Access token of oauth2.
 * @param {string} refreshToken - Refresh token of oauth2.
 * @param {string} tokenType - Token type of oauth2.
 * @param {string} queryType - Method of call ('get' or 'post').
 * @param {string} queryUrl - Url to send query.
 * @param {string} queryParams - Array of query params.
 * @returns {Promise} Result of query .
 * @example
 * oauth2.executeQuery('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85', '78v4f3df83g74v1fsd8375f63gvrf5c',
 *  'Bearer', 'get', 'http://localhost/apiname',[...]);
 */
async function executeQuery(accessToken, refreshToken, tokenType, queryType, queryUrl, queryParams) {
  // TODO a virer
  logger.debug(refreshToken);
  refreshTokenAccess('', '', refreshToken);

  const headerConfig = {
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
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
      Object.keys(queryParamsExtract).forEach(function(key) {
        logger.debug(key, queryParamsExtract[key]);
        data[key] = queryParamsExtract[key];
      });

      result = await axios.post(queryUrl, data, headerConfig);
    }

    return result;
  } catch (error) {
    logger.debug('Access Token Error', error.message);
    // logger.debug(error);

    return null;
  }
}

module.exports = {
  executeQuery,
};

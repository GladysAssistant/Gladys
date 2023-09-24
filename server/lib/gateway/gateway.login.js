const get = require('get-value');
const { webcrypto } = require('crypto');
const logger = require('../../utils/logger');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { Error403, Error500 } = require('../../utils/httpErrors');

/**
 * @description Login to Gladys Gateway.
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @returns {Promise<object>} Resolve with login response.
 * @example
 * login('tony.stark@test.fr', 'warmachine123');
 */
async function login(email, password) {
  try {
    // if we're already connected to the Gladys Gateway, we disconnect.
    if (this.gladysGatewayClient) {
      this.gladysGatewayClient.disconnect();
    }
    // create a new instance of the client
    this.gladysGatewayClient = new this.GladysGatewayClient({
      cryptoLib: webcrypto,
      serverUrl: this.config.gladysGatewayServerUrl,
      logger,
    });
    // We login with email/password to get two factor token
    const loginResults = await this.gladysGatewayClient.login(email, password);
    return loginResults;
  } catch (e) {
    logger.debug(e);
    const status = get(e, 'response.status');
    if (status) {
      throw new Error403();
    } else {
      throw new Error500(ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET);
    }
  }
}

module.exports = {
  login,
};

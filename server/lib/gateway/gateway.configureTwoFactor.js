const get = require('get-value');
const logger = require('../../utils/logger');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { Error403, Error500 } = require('../../utils/httpErrors');

/**
 * @description Get the two-factor secret (otpauth URL) to configure 2FA on a Gladys Plus account.
 * @param {string} accessToken - Access token returned by the Gateway login when 2FA is not enabled yet.
 * @returns {Promise<object>} Resolve with an object containing the otpauth_url.
 * @example
 * configureTwoFactor('access-token');
 */
async function configureTwoFactor(accessToken) {
  try {
    const result = await this.gladysGatewayClient.configureTwoFactor(accessToken);
    return result;
  } catch (e) {
    logger.debug(e);
    const status = get(e, 'response.status');
    if (status) {
      throw new Error403();
    }
    throw new Error500(ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET);
  }
}

module.exports = {
  configureTwoFactor,
};

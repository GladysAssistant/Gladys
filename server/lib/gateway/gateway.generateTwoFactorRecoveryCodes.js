const get = require('get-value');
const logger = require('../../utils/logger');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { Error403, Error500 } = require('../../utils/httpErrors');

/**
 * @description Generate a new set of single-use two-factor recovery codes on the Gladys Plus account.
 * @returns {Promise<object>} Resolve with the plain text recovery codes.
 * @example
 * generateTwoFactorRecoveryCodes();
 */
async function generateTwoFactorRecoveryCodes() {
  try {
    const result = await this.gladysGatewayClient.generateTwoFactorRecoveryCodes();
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
  generateTwoFactorRecoveryCodes,
};

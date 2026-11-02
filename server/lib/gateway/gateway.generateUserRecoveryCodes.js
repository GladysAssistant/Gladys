const get = require('get-value');
const logger = require('../../utils/logger');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { Error403, Error404, Error500 } = require('../../utils/httpErrors');

/**
 * @description Generate a new set of two-factor recovery codes for a Gladys Plus
 * user of the account this instance is linked to. The instance stands in for the
 * second factor: no code from the two-factor app is needed, which is how a user who
 * lost both their app and their recovery codes gets back into their account. The
 * previous codes are invalidated and Gladys Plus notifies the user by email.
 * @param {string} gatewayUserId - The Gladys Plus user id.
 * @returns {Promise<object>} Resolve with the recovery codes (displayed once).
 * @example
 * const { recovery_codes } = await generateUserRecoveryCodes('a139e4a6-ec6c-442d-9730-0499155d38d4');
 */
async function generateUserRecoveryCodes(gatewayUserId) {
  try {
    const result = await this.gladysGatewayClient.generateTwoFactorRecoveryCodesInstance(gatewayUserId);
    logger.warn(`Gladys Plus two-factor recovery codes generated from this instance for user ${gatewayUserId}`);
    return result;
  } catch (e) {
    logger.debug(e);
    const status = get(e, 'response.status');
    if (status === 404) {
      throw new Error404(ERROR_MESSAGES.GATEWAY_USER_NOT_FOUND);
    }
    if (status === 403) {
      throw new Error403(ERROR_MESSAGES.GATEWAY_TWO_FACTOR_NOT_ENABLED);
    }
    if (status) {
      throw new Error500();
    }
    throw new Error500(ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET);
  }
}

module.exports = {
  generateUserRecoveryCodes,
};

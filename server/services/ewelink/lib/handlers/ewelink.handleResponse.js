const { BadParameters, NotFoundError, ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { CONFIGURATION_KEYS } = require('../utils/constants');

/**
 * @description Provides a single way to manage WS responses.
 * @param {object} response - WebService response.
 * @returns {Promise} The WS call response.
 * @example
 * const data = this.handleResponse(res, (data) => console.log);
 */
async function handleResponse(response) {
  const { error, msg, reason, data } = response;
  const message = msg || reason;
  logger.debug(`eWeLink response: %j`, response);

  if (error) {
    // see https://coolkit-technologies.github.io/eWeLink-API/#/en/APICenterV2?id=error-codes
    logger.error(`eWeLink: error with API - ${message}`);
    switch (error) {
      case 401:
      case 402:
        await this.gladys.variable.destroy(CONFIGURATION_KEYS.USER_TOKENS, this.serviceId);
        this.closeWebSocketClient();
        this.updateStatus({ connected: false });
        throw new ServiceNotConfiguredError(message);
      case 400:
        throw new BadParameters(message);
      case 405:
      case 4002:
        throw new NotFoundError(message);
      default:
        throw new Error(message);
    }
  }

  return data;
}

module.exports = { handleResponse };

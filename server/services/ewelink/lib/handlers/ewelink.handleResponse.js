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
  const { error, msg, data } = response;
  logger.debug(`eWeLink response: %j`, response);

  if (error) {
    // see https://coolkit-technologies.github.io/eWeLink-API/#/en/APICenterV2?id=error-codes
    logger.error(`eWeLink: error with API - ${msg}`);
    switch (error) {
      case 401:
      case 402:
        await this.gladys.variable.destroy(CONFIGURATION_KEYS.USER_TOKENS, this.serviceId);
        this.closeWebSocketClient();
        this.updateStatus({ connected: false });
        throw new ServiceNotConfiguredError(msg);
      case 400:
        throw new BadParameters(msg);
      case 405:
      case 4002:
        throw new NotFoundError(msg);
      default:
        throw new Error(msg);
    }
  }

  return data;
}

module.exports = { handleResponse };

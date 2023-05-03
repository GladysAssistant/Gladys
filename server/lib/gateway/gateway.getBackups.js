const get = require('get-value');

const logger = require('../../utils/logger');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { Error403, Error500 } = require('../../utils/httpErrors');

/**
 * @description Get list of backups.
 * @returns {Promise} Resolve with list of backups.
 * @example
 * getBackups();
 */
async function getBackups() {
  try {
    const backups = await this.gladysGatewayClient.getBackups();
    return backups;
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
  getBackups,
};

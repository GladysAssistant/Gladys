const get = require('get-value');

const logger = require('../../utils/logger');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { Error402, Error403, Error500 } = require('../../utils/httpErrors');

/**
 * @description Get list of backups.
 * @returns {Promise} Resolve with list of backups.
 * @example
 * getBackups();
 */
async function getBackups() {
  try {
    // the probe of a locked instance: the only plan-gated call let through
    // while locked, its first success lifts the lock
    const backups = await this.callPlanGatedApi(() => this.gladysGatewayClient.getBackups(), { probe: true });
    return backups;
  } catch (e) {
    logger.debug(e);
    if (e instanceof Error402) {
      throw e;
    }
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

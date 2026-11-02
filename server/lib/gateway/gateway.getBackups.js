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
    // only a real 403 means the plan of the account does not include backups
    if (status === 403) {
      throw new Error403();
    }
    // any other HTTP error (502, 503, 429...) is Gladys Plus not answering
    // properly, not a plan question
    if (status) {
      throw new Error500(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
    throw new Error500(ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET);
  }
}

module.exports = {
  getBackups,
};

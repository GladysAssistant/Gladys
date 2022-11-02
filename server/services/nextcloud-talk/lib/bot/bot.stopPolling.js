const logger = require('../../../../utils/logger');

/**
 * @description Initiate bot poll message
 * @param {string} token - Token of conversation to stop.
 * @example
 * stopPoll('token1');
 */
function stopPolling(token) {
  logger.debug(`Stop polling Nextcloud Talk for token: ${token}`);
  this.bots[token].isPolling = false;
}

module.exports = {
  stopPolling,
};

const logger = require('../../../../utils/logger');

/**
 * @description Initiate bot poll message.
 * @param {string} userId - User to send message to.
 * @example
 * stopPoll('user1');
 */
function stopPolling(userId) {
  logger.debug(`Stop polling Nextcloud Talk for user: ${userId}`);
  this.bots[userId].isPolling = false;
  this.bots[userId].lastKnownMessageId = null;
  this.bots[userId].eventEmitter.removeListener('message', this.newMessageCb);
}

module.exports = {
  stopPolling,
};

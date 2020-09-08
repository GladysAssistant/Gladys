const logger = require('../../../utils/logger');

/**
 * @description Disconnect slack API
 * @example
 * disconnect();
 */
async function disconnect() {
  logger.debug('Disconnecting Slack API');
  if (this.bot) {
    await this.bot.disconnect();
  }
  this.bot = null;
}

module.exports = {
  disconnect,
};

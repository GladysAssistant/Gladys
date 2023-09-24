const logger = require('../../../utils/logger');

/**
 * @description Disconnect telegram API.
 * @example
 * disconnect();
 */
async function disconnect() {
  logger.debug('Disconnecting Telegram API');
  if (this.bot) {
    await this.bot.stopPolling();
  }
  this.bot = null;
}

module.exports = {
  disconnect,
};

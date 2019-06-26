const logger = require('../../../utils/logger');

/**
 * @description Connect telegram API
 * @param {string} token - Telegram API token.
 * @example
 * connect('test');
 */
async function connect(token) {
  // if bot already exist, we disconnect
  if (this.bot) {
    await this.disconnect();
  }
  this.bot = new this.NodeTelegramBotApi(token, { polling: true });
  this.bot.on('error', (e) => {
    logger.debug(e);
  });
  this.bot.on('message', this.newMessage.bind(this));
}

module.exports = {
  connect,
};

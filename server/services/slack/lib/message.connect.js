const logger = require('../../../utils/logger');

/**
 * @description Connect Slack API
 * @param {string} token - Slack API token.
 * @example
 * connect('test');
 */
async function connect(token) {
  // if bot already exist, we disconnect
  if (this.bot) {
    await this.disconnect();
  }
  this.bot = new this.NodeSlackBotApi(token);

  this.bot.on('error', (e) => {
    logger.debug(e);
  });
  this.bot.on('unable_to_rtm_start', async (e) => {
    logger.warn(`Slack rtm error, code = ${e.code}, message = ${e.message}`);
  });
  this.bot.on('message', this.newMessage.bind(this));
  await this.bot.start();
}

module.exports = {
  connect,
};

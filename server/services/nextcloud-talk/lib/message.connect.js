/**
 * @description Connect Nextcloud Talk
 * @param {Array} tokens - Nextcloud Talk tokens.
 * @example
 * connect(['token1','token2']);
 */
async function connect(tokens) {
  // if a bots exist, we disconnect
  if (this.bots.length > 0) {
    await this.disconnect();
  }

  tokens.forEach(async (token) => {
    const bot = new this.NextcloudTalkBot(this.gladys, this.serviceId, token);
    bot.startPolling();
    bot.on('message', this.newMessage.bind(this));

    this.bots.push(bot);
  });
}

module.exports = {
  connect,
};

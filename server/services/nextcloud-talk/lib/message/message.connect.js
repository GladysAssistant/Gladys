/**
 * @description Connect Nextcloud Talk
 * @param {Array} tokens - Nextcloud Talk tokens.
 * @example
 * connect([
 *  { value: 'token1', user_id: 'f0de00a8-8ba7-4a4e-8f5a-7a21e94f36a8' },
 *  { value: 'token2', user_id: '7f53d6ff-714f-4f08-a17b-df361a746d81' },
 * ]);
 */
async function connect(tokens) {
  // if a bots exist, we disconnect
  if (this.bots.length > 0) {
    await this.disconnect();
  }

  tokens.forEach(async (token) => {
    const bot = new this.NextcloudTalkBot(this.gladys, this.serviceId, token.user_id, token.value);
    bot.startPolling();
    bot.on('message', this.newMessage.bind(this));

    this.bots.push(bot);
  });
}

module.exports = {
  connect,
};

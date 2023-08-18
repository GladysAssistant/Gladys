const EventEmitter = require('events');

/**
 * @description Connect Nextcloud Talk.
 * @param {Array} tokens - Nextcloud Talk tokens.
 * @example
 * connect([
 *  { value: 'token1', user_id: 'f0de00a8-8ba7-4a4e-8f5a-7a21e94f36a8' },
 *  { value: 'token2', user_id: '7f53d6ff-714f-4f08-a17b-df361a746d81' },
 * ]);
 */
async function connect(tokens) {
  // if a bot exist, we disconnect
  if (Object.keys(this.bots).length > 0) {
    await this.disconnect();
  }

  this.abortController = new AbortController();

  tokens.forEach(async (token) => {
    if (!token.value) {
      return;
    }

    this.bots[token.user_id] = {
      userId: token.user_id,
      token: token.value,
      isPolling: false,
      eventEmitter: new EventEmitter(),
      lastKnownMessageId: null,
    };
    this.startPolling(token.user_id);
  });
}

module.exports = {
  connect,
};

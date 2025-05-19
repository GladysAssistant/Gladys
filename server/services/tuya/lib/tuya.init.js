const TuyaMessageSubscribeWebsocket = require('./tuyaWebsocket');

/**
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init() {
  const configuration = await this.getConfiguration();
  await this.connect(configuration);

  this.ws = new TuyaMessageSubscribeWebsocket({
    accessId: configuration.accessKey,
    accessKey: configuration.secretKey,
    url: configuration.wsEndpoint,
    env: configuration.serverTuyaEnv,
    maxRetryTimes: 3000,
  });
  this.ws.start();
  this.ws.message((ws, message) => {
    this.ws.ackMessage(message.messageId);
    this.handleFeedbackFromTuya(message);
  });
}

module.exports = {
  init,
};

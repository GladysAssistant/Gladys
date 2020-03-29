const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { Error500 } = require('../../../../utils/httpErrors');
const logger = require('../../../../utils/logger');
const { EWELINK_EMAIL_KEY, EWELINK_PASSWORD_KEY } = require('../utils/constants');

/**
 * @description Connect to eWeLink cloud account and get access token and api key.
 * @example
 * connect();
 */
async function connect() {
  this.configured = false;
  this.connected = false;
  const email = await this.gladys.variable.getValue(EWELINK_EMAIL_KEY, this.serviceId);
  const password = await this.gladys.variable.getValue(EWELINK_PASSWORD_KEY, this.serviceId);
  if (!email || !password) {
    throw new ServiceNotConfiguredError('EWeLink is not configured.');
  }
  this.configured = true;

  const connection = new this.EweLinkApi({ email, password, region: this.region });
  const auth = await connection.getCredentials();
  if (auth.error) {
    logger.warn(`EWeLink connect error: ${auth.msg}`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
      payload: auth.msg,
    });
    throw new Error500(`EWeLink connect error: ${auth.msg}`);
  }
  this.connected = true;
  this.accessToken = auth.at;
  this.apiKey = auth.user.apikey;
  this.region = auth.region;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
  });
}

module.exports = {
  connect,
};

const Promise = require('bluebird');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { EWELINK_EMAIL_KEY, EWELINK_PASSWORD_KEY, EWELINK_REGION_KEY, EWELINK_REGIONS } = require('../utils/constants');

/**
 * @description Connect to eWeLink cloud account and get access token and api key.
 * @example
 * connect();
 */
async function connect() {
  this.configured = false;
  this.connected = false;

  /* eslint-disable prefer-const */
  let [email, password, region] = await Promise.all([
    this.gladys.variable.getValue(EWELINK_EMAIL_KEY, this.serviceId),
    this.gladys.variable.getValue(EWELINK_PASSWORD_KEY, this.serviceId),
    this.gladys.variable.getValue(EWELINK_REGION_KEY, this.serviceId),
  ]);
  /* eslint-enable prefer-const */

  if (!email || !password) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
      payload: 'Service is not configured',
    });
    throw new ServiceNotConfiguredError('EWeLink error: Service is not configured');
  }

  if (!Object.values(EWELINK_REGIONS).includes(region)) {
    const connection = new this.EweLinkApi({ email, password });
    const response = await connection.getRegion();
    // belt, suspenders ;)
    if (response.error) {
      if (response.error === 406) {
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
          payload: 'Service is not configured',
        });
        throw new ServiceNotConfiguredError('EWeLink error: Service is not configured');
      }
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: response.msg,
      });
      throw new Error500(`EWeLink error: ${response.msg}`);
    }
    ({ region } = response);
    await this.gladys.variable.setValue(EWELINK_REGION_KEY, region, this.serviceId);
  }

  this.configured = true;

  const connection = new this.EweLinkApi({ email, password, region });
  const auth = await connection.getCredentials();
  if (auth.error) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
      payload: auth.msg,
    });
    // belt, suspenders ;)
    if ([400, 401, 404].indexOf(auth.error) !== -1 || auth.error === 301) {
      throw new Error401(`EWeLink error: ${auth.msg}`);
    }
    throw new Error500(`EWeLink error: ${auth.msg}`);
  }
  this.connected = true;
  this.accessToken = auth.at;
  this.apiKey = auth.user.apikey;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.EWELINK.CONNECTED,
  });
}

module.exports = {
  connect,
};

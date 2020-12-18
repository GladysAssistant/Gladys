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

  const email = await this.gladys.variable.getValue(EWELINK_EMAIL_KEY, this.serviceId);
  const password = await this.gladys.variable.getValue(EWELINK_PASSWORD_KEY, this.serviceId);
  let region = await this.gladys.variable.getValue(EWELINK_REGION_KEY, this.serviceId);

  if (!email || !password) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
      payload: 'Service is not configured',
    });
    throw new ServiceNotConfiguredError('eWeLink: Error, service is not configured');
  }

  if (!Object.values(EWELINK_REGIONS).includes(region)) {
    const connection = new this.EweLinkApi({ email, password });
    const response = await connection.getRegion();
    // belt, suspenders ;)
    if (response.error && [401, 406].indexOf(response.error) !== -1) {
      response.msg = 'Service is not configured';
    }
    await this.throwErrorIfNeeded(response, true, true);

    ({ region } = response);
    await this.gladys.variable.setValue(EWELINK_REGION_KEY, region, this.serviceId);
  }

  this.configured = true;

  const connection = new this.EweLinkApi({ email, password, region });
  const auth = await connection.getCredentials();
  await this.throwErrorIfNeeded(auth, true, true);

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

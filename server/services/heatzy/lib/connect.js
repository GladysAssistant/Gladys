const Promise = require('bluebird');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Connect to heatzy and set devices
 * @example
 * connect('heatzyUser', 'heatzyPassword');
 */
async function connect() {
  const heatzyLogin = await this.gladys.variable.getValue('HEATZY_LOGIN', this.serviceId);
  const heatzyPassword = await this.gladys.variable.getValue('HEATZY_PASSWORD', this.serviceId);

  if (!heatzyLogin || !heatzyPassword) {
    this.configured = false;
    throw new ServiceNotConfiguredError('Heatzy is not configured.');
  }
  this.configured = true;

  // logger.debug(`Trying to connect to Heatzy with login ${heatzyLogin}...`);
  this.heatzyClient = (await new this.heatzyLibrary(heatzyLogin, heatzyPassword));

  this.heatzyClient.getDevices()
    .then(devices => {
      logger.info(`Connected to Heatzy server with login ${heatzyLogin}`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.HEATZY.CONNECTED,
      });
      this.connected = true;
    })
    .catch((error) => {
      this.connected = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.HEATZY.ERROR,
        payload: error,
      });
      throw new ServiceNotConfiguredError(error);
    });
}

module.exports = {
  connect,
};

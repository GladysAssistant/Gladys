const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS } = require('./utils/tuya.constants');

/**
 * @description Discover Tuya cloud devices.
 * @returns {Promise} List of discovered devices;.
 * @example
 * await discoverDevices();
 */
async function discoverDevices() {
  logger.debug('Looking for Tuya devices...');
  if (this.status !== STATUS.CONNECTED) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: this.status },
    });
    throw new ServiceNotConfiguredError('Unable to discover Tuya devices until service is not well configured');
  }

  // Reset already discovered devices
  this.discoveredDevices = [];
  this.status = STATUS.DISCOVERING_DEVICES;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
    payload: { status: this.status },
  });

  let devices = [];
  try {
    devices = await this.loadDevices();
    logger.info(`${devices.length} Tuya devices found`);
  } catch (e) {
    logger.error('Unable to load Tuya devices', e);
  }

  await Promise.allSettled(devices.map((device) => this.loadDeviceDetails(device))).then((results) => {
    const discoveredDevices = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    this.discoveredDevices = discoveredDevices;
  });

  this.status = STATUS.CONNECTED;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
    payload: { status: this.status },
  });

  return this.discoveredDevices;
}

module.exports = {
  discoverDevices,
};

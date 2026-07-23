const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS } = require('./utils/melcloud-home.constants');
const { convertDevice } = require('./device/melcloud-home.convertDevice');

/**
 * @description Discover MELCloud Home air-to-air units.
 * @returns {Promise} List of discovered devices.
 * @example
 * await discoverDevices();
 */
async function discoverDevices() {
  logger.debug('Looking for MELCloud Home devices...');
  if (this.status !== STATUS.CONNECTED) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD_HOME.STATUS,
      payload: { status: this.status },
    });
    throw new ServiceNotConfiguredError('Unable to discover MELCloud Home devices until service is well configured');
  }

  // Reset already discovered devices
  this.discoveredDevices = [];
  this.status = STATUS.DISCOVERING_DEVICES;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD_HOME.STATUS,
    payload: { status: this.status },
  });

  let units = [];
  try {
    units = await this.loadDevices();
    logger.info(`${units.length} MELCloud Home devices found`);
  } catch (e) {
    logger.error('Unable to load MELCloud Home devices', e);
  }

  this.discoveredDevices = units
    .map((unit) => ({
      ...convertDevice(unit),
      service_id: this.serviceId,
    }))
    .filter((device) => {
      const existInGladys = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
      return existInGladys === null;
    });

  this.status = STATUS.CONNECTED;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD_HOME.STATUS,
    payload: { status: this.status },
  });

  return this.discoveredDevices;
}

module.exports = {
  discoverDevices,
};

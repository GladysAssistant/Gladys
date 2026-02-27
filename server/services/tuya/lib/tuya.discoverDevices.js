const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { mergeDevices } = require('../../../utils/device');

const { STATUS } = require('./utils/tuya.constants');
const { convertDevice } = require('./device/tuya.convertDevice');
const {
  applyExistingFeatureUnits,
  applyExistingLocalParams,
  normalizeExistingDevice,
} = require('./utils/tuya.deviceParams');

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

  this.discoveredDevices = await Promise.allSettled(
    devices.map((device) => this.loadDeviceDetails(device)),
  ).then((results) => results.filter((result) => result.status === 'fulfilled').map((result) => result.value));

  // Reset local connection fields - they will be restored from existing device params if available.
  this.discoveredDevices = this.discoveredDevices.map((device) => {
    const cloudIp = device.cloud_ip || device.ip;
    return {
      ...device,
      cloud_ip: cloudIp,
      ip: null,
      protocol_version: null,
      local_override: false,
    };
  });

  this.discoveredDevices = this.discoveredDevices
    .map((device) => ({
      ...convertDevice(device),
      service_id: this.serviceId,
    }))
    .map((device) => {
      const existing = normalizeExistingDevice(this.gladys.stateManager.get('deviceByExternalId', device.external_id));
      const deviceWithLocalParams = applyExistingLocalParams(device, existing);
      const deviceWithUnits = applyExistingFeatureUnits(deviceWithLocalParams, existing);
      return mergeDevices(deviceWithUnits, existing);
    });

  try {
    const existingDevices = await this.gladys.device.get({ service: 'tuya' });
    const discoveredByExternalId = new Map(this.discoveredDevices.map((device) => [device.external_id, device]));
    existingDevices.forEach((device) => {
      if (device && device.external_id && !discoveredByExternalId.has(device.external_id)) {
        this.discoveredDevices.push({ ...device, updatable: false });
      }
    });
  } catch (e) {
    logger.warn('Unable to load existing Tuya devices from Gladys', e);
  }

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

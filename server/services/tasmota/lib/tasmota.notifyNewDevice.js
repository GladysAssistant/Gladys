const { EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { buildDiscoveredDevice } = require('./tasmota.buildDiscoveredDevice');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {object} device - Discovered device.
 * @param {string} event - The vent to publish to.
 * @example
 * notifyNewDevice(discorveredDevice)
 */
async function notifyNewDevice(device, event) {
  try {
    const existing = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
    const defaultElectricMeterDeviceFeatureId = await this.gladys.energyPrice.getDefaultElectricMeterFeatureId();
    const mergedDevice = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: event,
      payload: mergedDevice,
    });
  } catch (e) {
    logger.warn(`Tasmota notifyNewDevice failed, fallback to mergeWithExistingDevice: ${e.message}`);
    const payload = this.mergeWithExistingDevice(device);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: event,
      payload,
    });
  }
}

module.exports = {
  notifyNewDevice,
};

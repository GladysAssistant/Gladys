const { EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { addEnergyFeatures } = require('../../energy-monitoring/utils/addEnergyFeatures');
const { mergeDevices } = require('../../../utils/device');

/**
 * @description Get all discovered devices, and if device already created, the Gladys device.
 * @param {object} device - Discovered device.
 * @param {string} event - The vent to publish to.
 * @example
 * notifyNewDevice(discorveredDevice)
 */
async function notifyNewDevice(device, event) {
  let existing;
  try {
    existing = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
    let payload;
    if (Array.isArray(device.features)) {
      device.features = device.features.reduce((acc, feature) => {
        if (!feature || !feature.external_id) {
          acc.push(feature);
          return acc;
        }
        const isDuplicate = acc.some((existingFeature) => existingFeature.external_id === feature.external_id);
        if (!isDuplicate) {
          acc.push(feature);
        }
        return acc;
      }, []);
      const defaultElectricMeterDeviceFeatureId = await this.gladys.energyPrice.getDefaultElectricMeterFeatureId();
      payload = addEnergyFeatures(device, defaultElectricMeterDeviceFeatureId);
    } else {
      payload = device;
    }

    payload = mergeDevices(payload, existing);

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: event,
      payload,
    });
  } catch (e) {
    logger.warn(`Tasmota notifyNewDevice failed, fallback to mergeDevices: ${e.message}`);
    const payload = mergeDevices(device, existing);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: event,
      payload,
    });
  }
}

module.exports = {
  notifyNewDevice,
};

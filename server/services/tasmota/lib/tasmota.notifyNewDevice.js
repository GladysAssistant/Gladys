const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { buildDiscoveredDevice, isTasmotaTotalEnergyIndex } = require('./tasmota.buildDiscoveredDevice');

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
    const deviceFeatures = Array.isArray(device.features) ? device.features : [];
    const existingFeatures = existing && Array.isArray(existing.features) ? existing.features : [];
    const hasEnergyTotal =
      deviceFeatures.some(isTasmotaTotalEnergyIndex) || existingFeatures.some(isTasmotaTotalEnergyIndex);
    const hasDerivedEnergy = existingFeatures.some(
      (f) =>
        f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        [
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
        ].includes(f.type),
    );

    let payload;
    if (hasEnergyTotal || hasDerivedEnergy) {
      const defaultElectricMeterDeviceFeatureId = await this.gladys.energyPrice.getDefaultElectricMeterFeatureId();
      payload = buildDiscoveredDevice(device, existing, defaultElectricMeterDeviceFeatureId);
    } else {
      payload = this.mergeWithExistingDevice(device);
    }

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: event,
      payload,
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

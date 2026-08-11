const logger = require('../../../utils/logger');
const { mappings } = require('./deviceMappings');

// Which devices the bridge exposes: every compatible one, or only those the user picked.
const EXPOSURE_MODES = {
  ALL: 'all',
  SELECTION: 'selection',
};

const EXPOSURE_MODE_VARIABLE = 'HOMEKIT_EXPOSURE_MODE';
const EXPOSED_DEVICES_VARIABLE = 'HOMEKIT_EXPOSED_DEVICES';

/**
 * @description Tell if a device carries at least one feature HomeKit knows how to expose.
 * @param {object} device - Gladys device to test.
 * @returns {boolean} True when the device can be exposed as a HomeKit accessory.
 * @example
 * isCompatibleDevice({ features: [{ category: 'light', type: 'binary' }] });
 */
function isCompatibleDevice(device) {
  return device.features.some(
    (feature) => mappings[feature.category] && mappings[feature.category].capabilities[feature.type],
  );
}

/**
 * @description Get every Gladys device the HomeKit bridge is able to expose.
 * @returns {Promise<Array>} The compatible devices.
 * @example
 * const devices = await getCompatibleDevices();
 */
async function getCompatibleDevices() {
  const devices = await this.gladys.device.get();
  return devices.filter(isCompatibleDevice);
}

/**
 * @description Get the devices the bridge must expose: every compatible one by default, or only the
 * ones the user selected. The selection is an allow list, so a device added later stays out of
 * HomeKit until it is picked.
 * @returns {Promise<Array>} The devices to expose.
 * @example
 * const devices = await getExposedDevices();
 */
async function getExposedDevices() {
  const compatibleDevices = await this.getCompatibleDevices();

  const mode = await this.gladys.variable.getValue(EXPOSURE_MODE_VARIABLE, this.serviceId);
  if (mode !== EXPOSURE_MODES.SELECTION) {
    return compatibleDevices;
  }

  const rawSelection = await this.gladys.variable.getValue(EXPOSED_DEVICES_VARIABLE, this.serviceId);
  let selectedSelectors = [];
  try {
    selectedSelectors = JSON.parse(rawSelection || '[]');
  } catch (e) {
    // Expose nothing rather than everything: a broken selection must not silently expose devices
    // the user took out of HomeKit. An empty bridge is visible and recoverable.
    logger.warn(`HomeKit: unable to parse ${EXPOSED_DEVICES_VARIABLE}, no device will be exposed`);
    return [];
  }

  if (!Array.isArray(selectedSelectors)) {
    logger.warn(`HomeKit: ${EXPOSED_DEVICES_VARIABLE} is not an array, no device will be exposed`);
    return [];
  }

  return compatibleDevices.filter((device) => selectedSelectors.includes(device.selector));
}

module.exports = {
  EXPOSURE_MODES,
  EXPOSURE_MODE_VARIABLE,
  EXPOSED_DEVICES_VARIABLE,
  isCompatibleDevice,
  getCompatibleDevices,
  getExposedDevices,
};

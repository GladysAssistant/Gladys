const logger = require('../../../utils/logger');
const { mappings } = require('./deviceMappings');

// Which devices the bridge exposes: every compatible one, or only those the user picked.
const EXPOSURE_MODES = {
  ALL: 'all',
  SELECTION: 'selection',
};

const EXPOSURE_MODE_VARIABLE = 'HOMEKIT_EXPOSURE_MODE';
const EXPOSED_DEVICES_VARIABLE = 'HOMEKIT_EXPOSED_DEVICES';

// The alarm of a house is not a device, but the exposure setting is an allow list of selectors and
// someone who does not use the Gladys alarm must be able to leave it out like any other accessory.
// It is offered under a prefixed selector, which cannot collide with a device one.
const ALARM_SELECTOR_PREFIX = 'house-alarm:';

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
 * @description List the house alarms the bridge is able to expose. Every house has an alarm mode,
 * so every house is offered.
 * @returns {Promise<Array>} The exposable alarms, each carrying the house it belongs to.
 * @example
 * const alarms = await getCompatibleAlarms();
 */
async function getCompatibleAlarms() {
  const houses = await this.gladys.house.get();

  return houses.map((house) => ({ name: house.name, selector: `${ALARM_SELECTOR_PREFIX}${house.selector}`, house }));
}

/**
 * @description Read the allow list of selectors the user picked, or null when every compatible
 * accessory is exposed.
 * @returns {Promise<Array|null>} The selected selectors, or null when the mode is not a selection.
 * @example
 * const selection = await readSelection();
 */
async function readSelection() {
  const mode = await this.gladys.variable.getValue(EXPOSURE_MODE_VARIABLE, this.serviceId);
  if (mode !== EXPOSURE_MODES.SELECTION) {
    return null;
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

  return selectedSelectors;
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
  const selection = await readSelection.call(this);

  return selection === null ? compatibleDevices : compatibleDevices.filter((d) => selection.includes(d.selector));
}

/**
 * @description Get the house alarms the bridge must expose, through the same allow list as the
 * devices.
 * @returns {Promise<Array>} The alarms to expose.
 * @example
 * const alarms = await getExposedAlarms();
 */
async function getExposedAlarms() {
  const compatibleAlarms = await this.getCompatibleAlarms();
  const selection = await readSelection.call(this);

  return selection === null ? compatibleAlarms : compatibleAlarms.filter((a) => selection.includes(a.selector));
}

module.exports = {
  EXPOSURE_MODES,
  EXPOSURE_MODE_VARIABLE,
  EXPOSED_DEVICES_VARIABLE,
  ALARM_SELECTOR_PREFIX,
  isCompatibleDevice,
  getCompatibleDevices,
  getCompatibleAlarms,
  getExposedDevices,
  getExposedAlarms,
};

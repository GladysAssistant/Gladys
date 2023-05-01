const exposesMap = require('../exposes');

/**
 * @description Convert Zigbee2mqtt device value into Gladys value.
 * @param {string} deviceName - Device name.
 * @param {string} property - Zigbee device feature property.
 * @param {number | string | boolean | object} value - Device value.
 * @returns {number|string|boolean} Gladys value.
 * @example
 * readValue('deviceName', 'alarm', 'ON');
 */
function readValue(deviceName, property, value) {
  // Looks mapping from exposes
  const expose = this.findMatchingExpose(deviceName, property);
  if (!expose) {
    throw new Error(`Zigbee2mqqt expose not found on device "${deviceName}" with property "${property}".`);
  }

  const matchingValue = exposesMap[expose.type].readValue(expose, value);

  if (matchingValue === undefined) {
    throw new Error(`Zigbee2mqqt don't handle value "${value}" for property "${property}".`);
  }

  return matchingValue;
}

module.exports = {
  readValue,
};

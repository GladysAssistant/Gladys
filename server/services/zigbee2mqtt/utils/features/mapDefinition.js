const { mapExpose } = require('./mapExpose');

/**
 * @description Build Gladys features according to Zigbee device.
 * @param {string} deviceName - Device name.
 * @param {object} definition - Zigbee device definition.
 * @returns {Array} The related Gladys features.
 * @example mapDefinition('MyDevice', {});
 */
function mapDefinition(deviceName, definition = {}) {
  const { exposes = [] } = definition;

  // Build feature according to device
  return exposes.flatMap((e) => mapExpose(deviceName, e));
}

module.exports = {
  mapDefinition,
};

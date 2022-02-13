const { mapExposeParameters } = require('./mapExposeParameters');

/**
 * @description Build Gladys device parameters according to Zigbee device.
 * @param {Object} definition - Zigbee device definition.
 * @returns {Array} The related Gladys parameters.
 *
 * @example mapDefinitionParameters('MyDevice', {});
 */
function mapDefinitionParameters(definition = {}) {
  const { exposes = [] } = definition;

  // Build feature according to device
  return exposes.flatMap((expose) => mapExposeParameters(expose));
}

module.exports = {
  mapDefinitionParameters,
};

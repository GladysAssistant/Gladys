const { mapBinaryParameters } = require('./mapBinaryParameters');

/**
 * @description Creates device parameters to keep value mappings.
 * @param {Object} expose - Zigbee "expose" values.
 * @returns {Object} The related Gladys feature parameters.
 *
 * @example mapExpose({ type: 'binary', ... }, { value_on: 'ON', value_off: 'OFF' });
 */
function mapExposeParameters(expose) {
  switch (expose.type) {
    case 'binary':
      return mapBinaryParameters(expose);
    default:
      // Next step can handle "enum" types here, for cube and button devices
      return [];
  }
}

module.exports = {
  mapExposeParameters,
};

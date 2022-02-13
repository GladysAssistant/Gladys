const { DEVICE } = require('../../lib/constants');

/**
 * @description Creates device parameters to keep value mappings.
 * @param {Object} expose - Zigbee "expose" values.
 * @returns {Array} The related Gladys feature parameters.
 *
 * @example mapBinaryParameters({ property: 'alarm', value_on: 'ON', value_off: 'OFF' });
 */
function mapBinaryParameters(expose) {
  const { value_on: on, value_off: off, property } = expose;

  return [
    {
      name: `${DEVICE.PARAM_PREFIX}${property}`,
      value: JSON.stringify({ 0: off, 1: on, [off]: 0, [on]: 1 }),
    },
  ];
}

module.exports = {
  mapBinaryParameters,
};

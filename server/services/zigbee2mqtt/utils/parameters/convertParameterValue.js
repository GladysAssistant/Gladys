const logger = require('../../../../utils/logger');
const { getDeviceParam } = require('../../../../utils/device');
const { DEVICE } = require('../../lib/constants');

/**
 * @description Map value from Gladys to Zigbee, or toher way.
 * @param {Object} device - Gladys device.
 * @param {string} property - Zigbee property.
 * @param {string|number|boolean} value - Value to map.
 * @returns {any} Mapped value, or undefined if none match.
 * @example
 * convertParametersValue({params: [...]}, 'property', 'ON');
 */
function convertParametersValue(device, property, value) {
  // Looks mapping from parameters
  const matchingParam = getDeviceParam(device, `${DEVICE.PARAM_PREFIX}${property}`);
  if (matchingParam) {
    try {
      const valueMap = JSON.parse(matchingParam);
      return valueMap[`${value}`];
    } catch (e) {
      logger.error(`Unable to decode value maaping for '${property}' property from device parameters`);
    }
  }

  return undefined;
}

module.exports = {
  convertParametersValue,
};

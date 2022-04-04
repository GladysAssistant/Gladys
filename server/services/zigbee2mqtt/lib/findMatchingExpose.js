const logger = require('../../../utils/logger');

const recursiveSearch = (expose, type, search) => {
  const { property, features = [] } = expose;
  if (property === search) {
    return expose;
  }

  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const result = recursiveSearch(feature, type || feature.type, search);
    if (result) {
      return result;
    }
  }

  return undefined;
};

/**
 * @description Map value from Gladys to Zigbee, or toher way.
 * @param {string} deviceName - Device name.
 * @param {string} property - Zigbee property.
 * @returns {any} Mapped value, or undefined if none match.
 * @example
 * findMatchingExpose({params: [...]}, 'property');
 */
function findMatchingExpose(deviceName, property) {
  // Get matching original device
  const discoveredDevice = this.discoveredDevices[deviceName];
  if (!discoveredDevice) {
    logger.debug(`Device "${deviceName}" not found`);
    return undefined;
  }

  // Looks for matching "expose" or sub-feature
  const { exposes } = discoveredDevice.definition;
  const expose = recursiveSearch({ features: exposes }, undefined, property);
  if (!expose) {
    logger.debug(`Exposed property "${property}" on device "${deviceName}" not found`);
  }

  return expose;
}

module.exports = {
  findMatchingExpose,
};

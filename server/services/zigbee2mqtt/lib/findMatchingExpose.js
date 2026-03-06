const logger = require('../../../utils/logger');

const recursiveSearch = (expose, type, search, parent = undefined) => {
  const { property, features = [] } = expose;
  if (property === search) {
    return { expose, parent };
  }

  const currentParent = expose.type === 'composite' ? expose : parent;

  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const result = recursiveSearch(feature, type || feature.type, search, currentParent);
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
  const result = recursiveSearch({ features: exposes }, undefined, property);
  if (!result) {
    logger.debug(`Exposed property "${property}" on device "${deviceName}" not found`);
  }

  return result;
}

module.exports = {
  findMatchingExpose,
};

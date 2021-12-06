const get = require('get-value');
const mappings = require('./deviceMappings');

/**
 * @description Format a Gladys device the Alexa way
 * @example const deviceAlexa = syncDeviceConverter(device);
 * @param {Object} device - The device to convert.
 * @returns {Object|null} Return the alexa formatted device or null if not handled.
 */
function syncDeviceConverter(device) {
  const endpoint = {
    endpointId: device.selector,
    friendlyName: device.name,
    displayCategories: [],
    capabilities: [],
    connections: [],
  };

  // We create a unique map of device features
  const uniqueDeviceFeatures = new Map();
  device.features.forEach((feature) => {
    const key = `${feature.category}${feature.type}`;
    if (!uniqueDeviceFeatures.has(key)) {
      uniqueDeviceFeatures.set(key, feature);
    }
  });

  uniqueDeviceFeatures.forEach((value, key) => {
    const displayCategory = get(mappings, `${value.category}.category`);
    // We add a display category if not already present
    if (displayCategory && endpoint.displayCategories.indexOf(displayCategory) === -1) {
      endpoint.displayCategories.push(displayCategory);
    }
    // we get the capability if handled
    const capability = get(mappings, `${value.category}.capabilities.${value.type}`);
    if (capability) {
      endpoint.capabilities.push(capability);
    }
  });

  // if nothing is handled in this device, return null
  if (endpoint.capabilities.length === 0) {
    return null;
  }
  // otherwise, return the full endpoint
  return endpoint;
}

module.exports = {
  syncDeviceConverter,
};

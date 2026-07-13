const get = require('get-value');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { mappings } = require('./deviceMappings');

const COVER_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.SHUTTER, DEVICE_FEATURE_CATEGORIES.CURTAIN];

/**
 * @description Check if a Gladys device feature should be exposed to Alexa.
 * @param {object} device - The Gladys device.
 * @param {object} feature - The device feature.
 * @returns {boolean} True if the feature should be exposed.
 * @example
 * isFeatureExposedToAlexa(device, feature);
 */
function isFeatureExposedToAlexa(device, feature) {
  if (feature.read_only) {
    return false;
  }

  const capability = get(mappings, `${feature.category}.capabilities.${feature.type}`);
  if (!capability) {
    return false;
  }

  if (COVER_CATEGORIES.includes(feature.category) && feature.type === DEVICE_FEATURE_TYPES.SHUTTER.STATE) {
    const positionFeature = device.features.find(
      (deviceFeature) =>
        deviceFeature.category === feature.category &&
        deviceFeature.type === DEVICE_FEATURE_TYPES.SHUTTER.POSITION &&
        deviceFeature.read_only === false,
    );
    if (positionFeature) {
      return false;
    }
  }

  return true;
}

/**
 * @description Format a Gladys device the Alexa way.
 * @example const deviceAlexa = syncDeviceConverter(device);
 * @param {object} device - The device to convert.
 * @returns {object | null} Return the alexa formatted device or null if not handled.
 */
function syncDeviceConverter(device) {
  const endpoint = {
    endpointId: device.selector,
    friendlyName: device.name,
    manufacturerName: 'Gladys Assistant',
    description: device.name,
    additionalAttributes: {},
    displayCategories: [],
    capabilities: [],
  };

  // We create a unique map of device features
  const uniqueDeviceFeatures = new Map();
  device.features.forEach((feature) => {
    const key = `${feature.category}${feature.type}`;
    if (!uniqueDeviceFeatures.has(key)) {
      uniqueDeviceFeatures.set(key, feature);
    }
  });

  uniqueDeviceFeatures.forEach((value) => {
    const displayCategory = get(mappings, `${value.category}.category`);
    // We add a display category if not already present
    if (displayCategory && endpoint.displayCategories.indexOf(displayCategory) === -1) {
      endpoint.displayCategories.push(displayCategory);
    }
    // Alexa only allows semantics stateMappings on one controller per endpoint.
    // When position is available, prefer RangeController over ModeController.
    if (!isFeatureExposedToAlexa(device, value)) {
      return;
    }

    const capability = get(mappings, `${value.category}.capabilities.${value.type}`);
    if (capability) {
      endpoint.capabilities.push(capability);
    }
  });

  // if nothing is handled in this device, return null
  if (endpoint.capabilities.length === 0) {
    return null;
  }

  endpoint.capabilities.push({
    type: 'AlexaInterface',
    interface: 'Alexa',
    version: '3',
  });

  // otherwise, return the full endpoint
  return endpoint;
}

module.exports = {
  syncDeviceConverter,
  isFeatureExposedToAlexa,
};

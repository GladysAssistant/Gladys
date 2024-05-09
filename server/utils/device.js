const get = require('get-value');
/**
 * @description Get Device param by name.
 * @param {object} device - Device Object to parse.
 * @param {string} paramName - The name of the param to get.
 * @returns {string} Return param.
 * @example
 * const value = getDeviceParam({
 *  params: [{ name: 'test', value: 1 }]
 * }, 'test');
 */
function getDeviceParam(device, paramName) {
  if (!get(device, 'params')) {
    return null;
  }
  const param = device.params.find((oneParam) => oneParam.name === paramName);
  if (param) {
    return param.value;
  }
  return null;
}

/**
 * @description Set Device param by name.
 * @param {object} device - Device Object to parse.
 * @param {string} paramName - The name of the param to get.
 * @param {string} newValue - The value to set.
 * @returns {null} Return when object was modified.
 * @example
 * setDeviceParam({
 *  params: [{ name: 'test', value: 1 }]
 * }, 'test', 'new-value');
 */
function setDeviceParam(device, paramName, newValue) {
  if (!device.params) {
    device.params = [];
  }
  const param = device.params.find((oneParam) => oneParam.name === paramName);
  if (param) {
    param.value = newValue;
  } else {
    device.params.push({
      name: paramName,
      value: newValue,
    });
  }
  return null;
}

/**
 * @description Get Device param by name.
 * @param {object} device - Device Object to parse.
 * @param {string} category - The category of the feature to get.
 * @param {string} type - The type of the feature to get.
 * @returns {object} Return feature.
 * @example
 * const value = getDeviceFeature({
 *  features: [{ category: 'light', type: 'binary' }]
 * }, 'light', 'binary');
 */
function getDeviceFeature(device, category, type) {
  if (!get(device, 'features')) {
    return null;
  }
  const feature = device.features.find((oneFeature) => oneFeature.category === category && oneFeature.type === type);
  if (feature) {
    return feature;
  }
  return null;
}

/**
 * @description Add or update a param to a device.
 * @param {object} device - Device to add parameter.
 * @param {object} feature - The feature to add.
 * @returns {object} The device.
 * @example
 * setDeviceFeature({ features: [] }, { selector: 'feature' })
 */
function setDeviceFeature(device, feature) {
  let { features } = device;
  if (!features) {
    features = [];
    device.features = features;
  }

  const featureIndex = features.findIndex((p) => p.selector === feature.selector);
  if (featureIndex >= 0) {
    features[featureIndex] = feature;
  } else {
    features.push(feature);
  }

  return device;
}

const matchFeature = (features, feature) => {
  return features.findIndex((f) => f.external_id === feature.external_id);
};

const matchParam = (params, param) => {
  return params.findIndex((p) => p.name === param.name && p.value === param.value);
};

/**
 * @description Compares both argument devices and check if any changes occurred on following attributes:
 *  - features: check for added or deleted features (based only on external_id)
 *  - params: check for added, updated or deleted (based on name and value).
 * @param {object} newDevice - New device.
 * @param {object} existingDevice - Existing device.
 * @returns {boolean} Indicates if the new device is different from the existing one.
 * @example
 * hasDeviceChanged({ features: [(3)], params: [ ... ]}, { features: [(0)], params: [ ... ]})
 */
function hasDeviceChanged(newDevice, existingDevice = {}) {
  const { features, params } = newDevice;
  const existingFeatures = existingDevice.features || [];
  const existingParams = existingDevice.params || [];

  let deviceChanged = existingFeatures.length !== features.length || existingParams.length !== params.length;
  let i = 0;
  while (!deviceChanged && features[i]) {
    deviceChanged = matchFeature(existingFeatures, features[i]) < 0;
    i += 1;
  }

  i = 0;
  while (!deviceChanged && params[i]) {
    deviceChanged = matchParam(existingParams, params[i]) < 0;
    i += 1;
  }

  return deviceChanged;
}

/**
 * @description Merge feature attributes from existing with the new one.
 * It keeps 'name' and 'keep_history' attribute from existing.
 * @param {object} newFeature - Newly created feature.
 * @param {object} existingFeature - Already existing feature.
 * @returns {object} A new feature merged with existing one.
 * @example
 * mergeFeatures({ name: 'Default name' }, { name: 'Overriden name' })
 */
function mergeFeatures(newFeature, existingFeature = {}) {
  const featureToReturn = { ...newFeature };

  if (existingFeature && existingFeature.name) {
    featureToReturn.name = existingFeature.name;
  }

  if (existingFeature && existingFeature.keep_history !== undefined) {
    featureToReturn.keep_history = existingFeature.keep_history;
  }

  return featureToReturn;
}

/**
 * @description Merge device attributes from existing with the new one.
 * It keeps 'name', 'room_id' attributes from existing.
 * @param {object} newDevice - Newly created device.
 * @param {object} existingDevice - Already existing device.
 * @param {string} updateAttribute - The attribute to add on the device to check if it is still new or update.
 * @returns {object} A new device merged with existing one, or the new device if it didn't change.
 * @example
 * mergeDevices({ name: 'Default name', features: [] }, { name: 'Overriden name', features: [] })
 */
function mergeDevices(newDevice, existingDevice, updateAttribute = 'updatable') {
  // No existing device
  if (!existingDevice) {
    return newDevice;
  }

  const { features: newFeatures = [], params: newParams = [] } = newDevice;
  const { features: oldFeatures = [], params: oldParams = [], name, room_id: roomId } = existingDevice;

  let deviceChanged = oldFeatures.length !== newFeatures.length || oldParams.length !== newParams.length;

  // Group old features by external id
  const oldFeatureByExternalId = {};
  oldFeatures.forEach((oldFeature) => {
    oldFeatureByExternalId[oldFeature.external_id] = oldFeature;
  });

  // Merge matching features
  const features = newFeatures.map((newFeature) => {
    const oldFeature = oldFeatureByExternalId[newFeature.external_id];

    if (!oldFeature) {
      deviceChanged = true;
      return newFeature;
    }

    return mergeFeatures(newFeature, oldFeature);
  });

  let i = 0;
  while (!deviceChanged && newParams[i]) {
    deviceChanged = matchParam(oldParams, newParams[i]) < 0;
    i += 1;
  }

  return { ...existingDevice, ...newDevice, name, room_id: roomId, features, [updateAttribute]: deviceChanged };
}

/**
 * @description Normalize value to new range.
 * @param {number} value - Actual value.
 * @param {number} currentMin - Actual possible min value.
 * @param {number} currentMax - Actual possible max value.
 * @param {number} newRangeMin - Target possible min value.
 * @param {number} newRangeMax - Target possible max value.
 * @returns {number} New value in target range.
 * @example
 * normalize(5, 0, 255, 0, 360)
 */
function normalize(value, currentMin, currentMax, newRangeMin, newRangeMax) {
  return ((newRangeMax - newRangeMin) * (value - currentMin)) / (currentMax - currentMin) + newRangeMin;
}

/**
 * @description Check if variable is number.
 * @param {string|number} n - Variable to check.
 * @returns {boolean} Return true if variable is number.
 * @example isNumeric(12)
 */
function isNumeric(n) {
  return !Number.isNaN(parseFloat(n)) && Number.isFinite(n);
}

module.exports = {
  getDeviceParam,
  setDeviceParam,
  getDeviceFeature,
  setDeviceFeature,
  hasDeviceChanged,
  mergeFeatures,
  mergeDevices,
  normalize,
  isNumeric,
};

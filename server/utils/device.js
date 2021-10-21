const get = require('get-value');
/**
 * @description Get Device param by name.
 * @param {Object} device - Device Object to parse.
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
 * @param {Object} device - Device Object to parse.
 * @param {string} paramName - The name of the param to get.
 * @param {string} newValue - The value to set.
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
 * @param {Object} device - Device Object to parse.
 * @param {string} category - The category of the feature to get.
 * @param {string} type - The type of the feature to get.
 * @returns {Object} Return feature.
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

const matchFeature = (features, feature) => {
  return features.findIndex((f) => f.external_id === feature.external_id);
};

const matchParam = (params, param) => {
  return params.findIndex((p) => p.name === param.name && p.value === param.value);
};

/**
 * @description Compare newDevice with exisingDevice on features and parameters
 * to tell if device can be updated.
 *
 * @param {Object} newDevice - New device.
 * @param {Object} existingDevice - Existing device.
 * @returns {boolean} Is new device is different on feature or parameters?
 * @example
 * isUpdatable({}, {})
 */
function isUpdatable(newDevice, existingDevice = {}) {
  const { features, params } = newDevice;
  const existingFeatures = existingDevice.features || [];
  const existingParams = existingDevice.params || [];

  let updatable = existingFeatures.length !== features.length || existingParams.length !== params.length;
  let i = 0;
  while (!updatable && features[i]) {
    updatable = matchFeature(existingFeatures, features[i]) < 0;
    i += 1;
  }

  i = 0;
  while (!updatable && params[i]) {
    updatable = matchParam(existingParams, params[i]) < 0;
    i += 1;
  }

  return updatable;
}

module.exports = {
  getDeviceParam,
  setDeviceParam,
  getDeviceFeature,
  isUpdatable,
};

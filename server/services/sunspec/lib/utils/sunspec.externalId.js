/**
 * @description Return name of device.
 * @param {object} device - The sunspec device.
 * @returns {string} Return name.
 * @example
 * getDeviceName(device);
 */
function getDeviceName(device) {
  const type = device.mppt !== undefined ? `DC ${device.mppt}` : `AC`;
  return `${device.manufacturer} ${device.product} [${type}]`;
}

/**
 * @description Return external id of device.
 * @param {object} device - The sunspec device.
 * @returns {string} Return external id.
 * @example
 * getDeviceExternalId(device);
 */
function getDeviceExternalId(device) {
  const type = device.mppt !== undefined ? `dc${device.mppt}` : `ac`;
  return `sunspec:serialnumber:${device.serialNumber}:mppt:${type}`;
}

/**
 * @description Return name of device feature.
 * @param {object} feature - The sunspec devcie feature.
 * @returns {string} Return name.
 * @example
 * getDeviceFeatureName(feature);
 */
function getDeviceFeatureName(feature) {
  const type = feature.mppt !== undefined ? `DC ${feature.mppt}` : `AC`;
  return `${feature.manufacturer} ${feature.product} [${type}] - ${feature.property}`;
}

/**
 * @description Return external id of deviceFeature.
 * @param {object} device - The sunspec device property.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId({});
 */
function getDeviceFeatureExternalId(device) {
  const type = device.mppt !== undefined ? `dc${device.mppt}` : `ac`;
  return `sunspec:serialnumber:${device.serialNumber}:mppt:${type}:property:${device.property}`;
}

/**
 * @description Return device info of devicefeature.
 * @param {object} externalId - The externalId.
 * @returns {object} Return all informations.
 * @example
 * getDeviceInfoByExternalId(externalId);
 */
function getDeviceInfoByExternalId(externalId) {
  const array = externalId.split(':');
  const serialNumber = array[2];
  const type = array[4];
  let mppt;
  if (type === 'AC') {
    mppt = undefined;
  } else {
    mppt = parseInt(type.split(' ')[1], 10);
  }
  const property = array[6];
  return {
    serialNumber,
    mppt,
    property,
  };
}

module.exports = {
  getDeviceName,
  getDeviceExternalId,
  getDeviceFeatureName,
  getDeviceFeatureExternalId,
  getDeviceInfoByExternalId,
};
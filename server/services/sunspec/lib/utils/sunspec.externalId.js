/**
 * @description Return name of device.
 * @param {object} device - The sunspec device.
 * @returns {string} Return name.
 * @example
 * getDeviceName(device);
 */
function getDeviceName(device) {
  return `${device.manufacturer} ${device.product} [${device.mppt}]`;
}

/**
 * @description Return external id of device.
 * @param {object} device - The sunspec device.
 * @returns {string} Return external id.
 * @example
 * getDeviceExternalId(device);
 */
function getDeviceExternalId(device) {
  return `sunspec:serialnumber:${device.serialNumber}:mptt:${device.mppt}`;
}

/**
 * @description Return name of device feature.
 * @param {object} feature - The sunspec devcie feature.
 * @returns {string} Return name.
 * @example
 * getDeviceFeatureName(feature);
 */
function getDeviceFeatureName(feature) {
  return `${feature.manufacturer} ${feature.product} [${feature.mppt}] - ${feature.property}`;
}

/**
 * @description Return external id of deviceFeature.
 * @param {object} device - The sunspec device property.
 * @returns {string} Return external id.
 * @example
 * getDeviceFeatureExternalId({});
 */
function getDeviceFeatureExternalId(device) {
  return `sunspec:serialnumber:${device.serialNumber}:mptt:${device.mppt}:property:${device.property}`;
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
  const mppt = parseInt(array[4], 10);
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

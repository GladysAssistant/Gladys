const { getDeviceParam } = require('../../../../utils/device');
const { merossTogglePayload } = require('../../utils');

/**
 * @private
 * @description Turn on the plug.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @returns {Promise} Promise.
 * @example
 * turnOff(deviceFeature);
 */
function turnOff(device, deviceFeature) {
  const url = getDeviceParam(device, 'CAMERA_URL');
  return this.client.post(`${url}/config`, merossTogglePayload(this.getKey(), 0));
}

module.exports = turnOff;

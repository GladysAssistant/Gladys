const { STATE } = require('../../../../utils/constants');
const { getDeviceParam } = require('../../../../utils/device');
const { merossTogglePayload } = require('../../utils');

/**
 * @private
 * @description Get the current state of a device.
 * @param {Object} deviceFeature - The deviceFeature object.
 * @returns {Promise} Resolving with deviceFeature state.
 * @example
 * getState(deviceFeature);
 */
async function getState(device, deviceFeature) {
	const url = getDeviceParam(device, 'CAMERA_URL');
	const state = await this.client.post(`${url}/config`, merossTogglePayload(this.getKey()));
  return state.payload.all.digest.togglex[`0`].onoff === 1 ? STATE.ON : STATE.OFF;
}

module.exports = getState;

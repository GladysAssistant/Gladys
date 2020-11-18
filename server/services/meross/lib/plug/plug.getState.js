const { STATE } = require('../../../../utils/constants');

/**
 * @private
 * @description Get the current state of a device.
 * @param {Object} deviceFeature - The deviceFeature object.
 * @returns {Promise} Resolving with deviceFeature state.
 * @example
 * getState(deviceFeature);
 */
async function getState(device, deviceFeature) {
  const deviceUrlParam = device.params.find(param => param.name === 'CAMERA_URL');
  const state = await this.client.post(`${deviceUrlParam.value}/config`, {
	"header": {
		"from": "/app/886482-7c2c1d631e1aabbf35808d714a2eb22a/subscribe",
		"messageId": "848d3bae9d491b29479ce10aa34d9fb1",
		"method": "GET",
		"namespace": "Appliance.System.All",
		"payloadVersion": 1,
		"sign": "aee12dcb7fe80141e2fff42f0b14b6e1",
		"timestamp": 1605559973,
		"triggerSrc": "AndroidLocal"
	},
	"payload": {}
});
  return state.payload.all.digest.togglex[`0`].onoff === 1 ? STATE.ON : STATE.OFF;
}

module.exports = getState;

const { STATE } = require('../../../../utils/constants');

/**
 * @private
 * @description Get the current state of a device.
 * @param {object} deviceFeature - The deviceFeature object.
 * @returns {Promise} Resolving with deviceFeature state.
 * @example
 * getState(deviceFeature);
 */
async function getState(deviceFeature) {
  const state = await this.client.get(`https://some-api/${deviceFeature.external_id}`);
  return state === true ? STATE.ON : STATE.OFF;
}

module.exports = getState;

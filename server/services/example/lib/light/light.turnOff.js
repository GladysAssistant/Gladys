/**
 * @private
 * @description Turn on the light.
 * @param {Object} deviceFeature - The deviceFeature we wants to control.
 * @returns {Promise} Promise.
 * @example
 * turnOff(deviceFeature);
 */
function turnOff(deviceFeature) {
  return this.client.post(`https://some-api/${deviceFeature.external_id}/0`);
}

module.exports = turnOff;

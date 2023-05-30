/**
 * @private
 * @description Turn on the light.
 * @param {object} deviceFeature - The deviceFeature we wants to control.
 * @returns {Promise} Promise.
 * @example
 * turnOn(deviceFeature);
 */
function turnOn(deviceFeature) {
  return this.client.post(`https://some-api/${deviceFeature.external_id}/1`);
}

module.exports = turnOn;

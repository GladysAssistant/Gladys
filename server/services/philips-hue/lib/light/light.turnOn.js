const { parseExternalId } = require('../utils/parseExternalId');

/**
 * @description Turn On a Philips Hue light.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @example
 * turnOn(device, deviceFeature);
 */
async function turnOn(device, deviceFeature) {
  const state = this.lightState.create();
  const lightId = parseExternalId(device.external_id);
  await this.hueApi.setLightState(lightId, state.on());
}

module.exports = {
  turnOn,
};

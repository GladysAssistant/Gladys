const { parseExternalId } = require('../utils/parseExternalId');

/**
 * @description Turn Off a Philips Hue light.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @example
 * turnOff(device, deviceFeature);
 */
async function turnOff(device, deviceFeature) {
  const state = this.lightState.create();
  const lightId = parseExternalId(device.external_id);
  await this.hueApi.setLightState(lightId, state.off());
}

module.exports = {
  turnOff,
};

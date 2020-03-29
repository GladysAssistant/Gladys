const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { Error500 } = require('../../../../utils/httpErrors');
const logger = require('../../../../utils/logger');
const { STATE } = require('../../../../utils/constants');
const { parseExternalId } = require('../utils/parseExternalId');

/**
 * @description Change value of an eWeLink device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature);
 */
async function setValue(device, deviceFeature, value) {
  if (!this.connected) {
    await this.connect();
  }

  const { deviceId, channel } = parseExternalId(device.external_id);
  const connection = new this.EweLinkApi({ at: this.accessToken, apiKey: this.apiKey, region: this.region });
  const eWeLinkDevice = await connection.getDevice(deviceId);
  if (eWeLinkDevice.error) {
    throw new Error500(`EWeLink error: ${eWeLinkDevice.msg}`);
  }
  if (!eWeLinkDevice.online) {
    throw new NotFoundError('EWeLink error: Device is not currently online');
  }

  let response;
  let state;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state = value === STATE.ON ? 'on' : 'off';
      response = await connection.setDevicePowerState(deviceId, state, channel);
      if (response.error) {
        throw new Error500(`EWeLink error: ${response.msg}`);
      }
      break;
    default:
      logger.warn(`Feature type "${deviceFeature.type}" not handled yet !`);
      break;
  }
}

module.exports = {
  setValue,
};

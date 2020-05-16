const { DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { EWELINK_REGION_KEY } = require('../utils/constants');
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

  const region = await this.gladys.variable.getValue(EWELINK_REGION_KEY, this.serviceId);
  const connection = new this.EweLinkApi({ at: this.accessToken, apiKey: this.apiKey, region });

  const { deviceId, channel } = parseExternalId(device.external_id);
  const eweLinkDevice = await connection.getDevice(deviceId);
  await this.throwErrorIfNeeded(eweLinkDevice);

  if (!eweLinkDevice.online) {
    throw new NotFoundError('EWeLink error: Device is not currently online');
  }

  let response;
  let state;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state = value === STATE.ON ? 'on' : 'off';
      response = await connection.setDevicePowerState(deviceId, state, channel);
      await this.throwErrorIfNeeded(response);
      break;
    default:
      logger.warn(`EWeLink warning: Feature type "${deviceFeature.type}" not handled yet!`);
      break;
  }
}

module.exports = {
  setValue,
};

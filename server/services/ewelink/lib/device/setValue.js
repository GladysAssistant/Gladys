const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { writeBinaryValue } = require('../features/binary');
const { EWELINK_REGION_KEY } = require('../utils/constants');
const { parseExternalId } = require('../utils/externalId');

/**
 * @description Change value of an eWeLink device.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The deviceFeature to control.
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

  const { deviceId, channel } = parseExternalId(deviceFeature.external_id);
  const eweLinkDevice = await connection.getDevice(deviceId);
  await this.throwErrorIfNeeded(eweLinkDevice);

  if (!eweLinkDevice.online) {
    throw new NotFoundError('eWeLink: Error, device is not currently online');
  }

  let response;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.SWITCH.BINARY:
      response = await connection.setDevicePowerState(deviceId, writeBinaryValue(value), channel);
      await this.throwErrorIfNeeded(response);
      break;
    default:
      logger.warn(`eWeLink: Warning, feature type "${deviceFeature.type}" not handled yet!`);
      break;
  }
}

module.exports = {
  setValue,
};

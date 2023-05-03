const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { TP_LINK_ON, TP_LINK_OFF, TP_LINK_IP_ADDRESS } = require('../utils/consts');

/**
 * @description Change value of a TP-Link Device.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The device feature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise} Promise.
 * @example
 * setValue(device, value);
 */
async function setValue(device, deviceFeature, value) {
  logger.debug(`Changing state of device ${device} with value = ${value}`);
  const devices = await this.gladys.device.get({ service: 'tp-link' });
  const internalDevice = devices.find((d) => d.external_id === device.external_id);
  if (!internalDevice) {
    throw new NotFoundError(`TP_LINK_DEVICE_NOT_FOUND`);
  }
  const state = value === 1 ? TP_LINK_ON : TP_LINK_OFF;
  const deviceIp = internalDevice.params.find((p) => p.name === TP_LINK_IP_ADDRESS).value;
  const tpLinkDevice = await this.client.getDevice({ host: deviceIp });
  if (!tpLinkDevice) {
    throw new NotFoundError(`TP_LINK_DEVICE_NOT_ONLINE`);
  }

  // For future features about light
  switch (deviceFeature.category) {
    case 'switch':
    case 'light':
      tpLinkDevice.setPowerState(state);
      break;
    default:
      logger.error(`Trying to set Value for a not managed TP-Link Device ${device.external_id}`);
      throw new NotFoundError(`TP_LINK_FEATURE_NOT_MANAGED`);
  }
}

module.exports = {
  setValue,
};

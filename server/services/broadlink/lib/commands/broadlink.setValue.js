const { BadParameters, ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Send the new device value to Broadlink device.
 * @param {Object} device - Updated Gladys device.
 * @param {Object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
function setValue(device, deviceFeature, value) {
  const handler = this.handlers.find((h) => h.getPeripheralId(device));

  if (!handler) {
    throw new BadParameters(`${device.external_id} device is not managed by Broadlink`);
  }

  const peripheralId = handler.getPeripheralId(device);
  const peripheral = this.broadlinkDevices[peripheralId];

  if (!peripheral) {
    throw new ServiceNotConfiguredError(`${peripheralId} Broadlink peripheral is not discovered`);
  }

  handler.setValue(peripheral, device, deviceFeature, value);
  return null;
}

module.exports = {
  setValue,
};

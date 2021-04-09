const logger = require('../../../../../utils/logger');

/**
 * @description Send value to device.
 * @param {Object} peripheral - Broadlink peripheral.
 * @param {Object} device - Gladys device.
 * @param {Object} deviceFeature - Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * deviceHandler.setValue(peripheral, device, deviceFeature, 0);
 */
function setValue(peripheral, device, deviceFeature, value) {
  const convertedValue = value === 1 ? 'on' : value;
  const { external_id: externalId, type } = deviceFeature;
  const [, , switchId = 0] = externalId.split(':');

  logger.info(`Broadlink sending '${value}' for ${type} on ${peripheral.mac} (channel=${switchId})`);

  peripheral.setPower(convertedValue, parseInt(switchId, 10));
}

module.exports = {
  setValue,
};

const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

/**
 * @description Change value of a Ecovacs Vacbot
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  logger.debug(`Changing state of vacbot ${device.external_id} with value = ${value}`);
  const vacbot = await this.getVacbotObj(device.external_id);

  if (!vacbot) {
    throw new NotFoundError(`ECOVACS_API_NOT_FOUND`);
  }

  logger.debug(`DeviceFeature ${deviceFeature.type}`);
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.VACBOT.STATE:
      if (value === 1) {
        vacbot.clean();
      } else if (value === 0) {
        vacbot.pause();
      } else if (value === -1) {
        vacbot.stop();
      }
      break;
    default:
      logger.info(`Ecovacs : Feature type = "${deviceFeature.type}" not handled`);
      break;
  }
}

module.exports = {
  setValue,
};

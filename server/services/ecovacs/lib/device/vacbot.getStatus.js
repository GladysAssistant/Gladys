const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/ecovacs.externalId');


/**
 * @description Vacbot status.
 * @param {string} deviceExternalId - The deviceExternalId to control.
 * @returns {Promise<Object>} Promise object representing the status of the vacbot
 * @example
 * vacbot.getDeviceStatus();
 */
async function getDeviceStatus(deviceExternalId) {
  const vacbot = await this.getVacbotObj(deviceExternalId);
  const status = {
    name: vacbot.getName(),
    model: vacbot.deviceModel,
    imageUrl: vacbot.deviceImageURL,
    mainBrush: vacbot.hasMainBrush(),
    hasMappingCapabilities: vacbot.hasMappingCapabilities(),
    hasCustomAreaCleaningMode: vacbot.hasCustomAreaCleaningMode(),
    hasMoppingSystem: vacbot.hasMoppingSystem(),
  };
  logger.debug(`Vacbot ${deviceExternalId} status : ${JSON.stringify(status)}`);
  return status;
}

module.exports = {
  getDeviceStatus,
};

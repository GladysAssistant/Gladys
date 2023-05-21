const logger = require('../../../../utils/logger');

/**
 * @description Get the vacbot status.
 * @param {string} deviceExternalId - The deviceExternalId to control.
 * @returns {Promise<object>} Promise object representing the status of the vacbot.
 * @example
 * vacbot.getDeviceStatus();
 */
async function getDeviceStatus(deviceExternalId) {
  // TODO: is there a better way to do this ?
  let vacbot;
  this.vacbots.forEach((value, key) => {
    if (key.external_id === deviceExternalId) {
      vacbot = value;
    }
  });

  const status = {
    name: vacbot.getName(),
    model: vacbot.deviceModel,
    imageUrl: vacbot.deviceImageURL,
    mainBrush: vacbot.hasMainBrush(),
    hasMappingCapabilities: vacbot.hasMappingCapabilities(),
    hasCustomAreaCleaningMode: vacbot.hasCustomAreaCleaningMode(),
    hasMoppingSystem: vacbot.hasMoppingSystem(),
    chargeStatus: vacbot.chargeStatus,
    cleanReport: vacbot.cleanReport,
    batteryLevel: vacbot.batteryLevel,
  };
  logger.trace(`Vacbot charge status : ${Object.keys(vacbot)}`);
  logger.debug(`Vacbot ${deviceExternalId} status : ${JSON.stringify(status)}`);
  return status;
}

module.exports = {
  getDeviceStatus,
};

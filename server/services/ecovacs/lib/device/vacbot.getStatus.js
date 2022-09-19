const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/ecovacs.externalId');

/**
 * @description Vacbot status.
 * @param {string} deviceExternalId - The deviceExternalId to control.
 * @returns {any} Null.
 * @example
 * vacbot.getDeviceStatus();
 */
async function getDeviceStatus(deviceExternalId) {
  if (!this.connected) {
    await this.connect();
  }
  logger.debug(`Vacbot ${deviceExternalId}: status`);
  const { prefix, devicePid, deviceNumber } = parseExternalId(deviceExternalId);
  logger.debug(`${deviceExternalId} => ${prefix}  ${devicePid}  ${deviceNumber}`);
  const devices = await this.ecovacsClient.devices();
  const vacuum = devices[deviceNumber];
  const vacbot = this.ecovacsClient.getVacBot(
    this.ecovacsClient.uid,
    this.ecovacsLibrary.EcoVacsAPI.REALM,
    this.ecovacsClient.resource,
    this.ecovacsClient.user_access_token,
    vacuum,
  );
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

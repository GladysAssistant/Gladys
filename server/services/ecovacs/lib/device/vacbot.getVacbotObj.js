const { parseExternalId } = require('../utils/ecovacs.externalId');

/**
 * @description Vacbot object.
 * @param {string} deviceExternalId - The deviceExternalId to control.
 * @returns {Promise<object>} Promise object representing the vacbot object from ecovacs lib.
 * @example
 * vacbot.getVacbotObj();
 */
async function getVacbotObj(deviceExternalId) {
  if (!this.connected) {
    await this.connect();
  }
  const { deviceNumber } = parseExternalId(deviceExternalId);
  const devices = await this.ecovacsClient.devices();
  const vacuum = devices[deviceNumber];
  const vacbot = this.ecovacsClient.getVacBot(
    this.ecovacsClient.uid,
    this.ecovacsLibrary.EcoVacsAPI.REALM,
    this.ecovacsClient.resource,
    this.ecovacsClient.user_access_token,
    vacuum,
  );
  return vacbot;
}

module.exports = {
  getVacbotObj,
};

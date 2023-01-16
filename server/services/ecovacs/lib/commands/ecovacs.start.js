const logger = require('../../../../utils/logger');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');


/**
 * @description Starts Ecovacs device.
 * @returns {any} Null.
 * @example
 * ecovacs.start();
 */
function listening() {
  logger.debug(`Ecovacs: Listening`);
}

/**
 * @description Convert gladys ecovacs devices to vacbots.
 * @params Gladys devices
 * @returns {any} vacbots.
 * @example
 * ecovacs.devicesToVacbots();
 */
async function devicesToVacbots(devices) {
  let vacbots;
  if (this.configured && !this.connected) {
    this.connect();
  };
  const { deviceNumber } = parseExternalId(device.external_id);
  const ecovacsDevices = await this.ecovacsClient.devices();
  await Promise.map(ecovacsDevices, async (vacuum) => {
    const vacbot = this.ecovacsClient.getVacBot(
      this.ecovacsClient.uid,
      this.ecovacsLibrary.EcoVacsAPI.REALM,
      this.ecovacsClient.resource,
      this.ecovacsClient.user_access_token,
      vacuum,
    );
    vacbots.push(vacbot);
  });
}

/**
 * @description Starts Ecovacs device.
 * @returns {any} Null.
 * @example
 * ecovacs.start();
 */
async function start() {
  logger.debug(`Ecovacs: Starting`);
  const { accountId, password, countryCode } = await this.getConfiguration();
  logger.debug(`Ecovacs: ${accountId} ${password} ${countryCode}`);
  if (accountId || password || countryCode) {
    this.configured = true;
  }
  if (this.configured && !this.connected) {
    this.connect();
  }
  await this.listen();
}

module.exports = {
  start,
};

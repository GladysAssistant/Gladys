const logger = require('../../../../utils/logger');

/**
 * @description Starts Ecovacs device.
 * @example
 * ecovacs.start();
 */
async function start() {
  logger.debug(`Ecovacs: Starting`);
  const { login, password, countryCode } = await this.getConfiguration();
  logger.debug(`Ecovacs: ${login} ${password} ${countryCode}`);
  if (login || password || countryCode) {
    this.configured = true;
  }
  if (this.configured && !this.connected) {
    await this.connect();
  }

  // register all vacbot
  const registered = await this.gladys.device.get({
    service_id: 'Ecovacs'
  });
  logger.debug(`Registered : `, registered);
  registered.forEach(async (element) => {
    const vacbot = await this.getVacbotObj(element.external_id);
    this.vacbots.set(element, vacbot);
  });
  logger.debug(`In memory and ready to be handled : `, this.vacbots.size);


}

module.exports = {
  start,
};

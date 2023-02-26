const logger = require('../../../../utils/logger');

/**
 * @description Load vacbot device.
 * @example
 * ecovacs.loadVacbots();
 */
async function loadVacbots() {
  logger.debug(`Ecovacs: Loading Vacbots`);

  // Load all vacbot registered in gladys
  const registered = await this.gladys.device.get({
    service_id: this.serviceId,
  });
  logger.debug(`Registered : `, registered);
  registered.forEach(async (element) => {
    const vacbot = await this.getVacbotObj(element.external_id);
    this.vacbots.set(element, vacbot);
    logger.debug(
      `Loaded in memory and ready to be handled : ${element.external_id} (gladys device) ====> ${
        this.vacbots.get(element).deviceName
      } (vacbot object)`,
    );
  });
}

module.exports = {
  loadVacbots,
};

const logger = require('../../../../utils/logger');
// const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

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
  logger.trace(`Registered : `, registered);
  registered.forEach(async (device) => {
    const vacbot = await this.getVacbotObj(device.external_id);
    this.listen(vacbot, device);
    this.vacbots.set(device, vacbot);
    logger.debug(
      `Loaded in memory and ready to be handled : ${device.external_id} (gladys device) ====> ${
        this.vacbots.get(device).vacuum.deviceName
      } (vacbot object)`,
    );
  });
}

module.exports = {
  loadVacbots,
};

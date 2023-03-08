const logger = require('../../../../utils/logger');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

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
  registered.forEach(async (device) => {
    const vacbot = await this.getVacbotObj(device.external_id);
    if (!vacbot.is_ready) {
      logger.trace(`Connect vacbot `);
      vacbot.connect();
    }
    vacbot.on('BatteryInfo', eventFunctionWrapper(this.onMessage.bind(this, 'BatteryInfo', device)));

    this.vacbots.set(device, vacbot);
    logger.debug(this.vacbots.get(device));
    logger.debug(
      `Loaded in memory and ready to be handled : ${device.external_id} (gladys device) ====> ${
        this.vacbots.get(device).vacuum.deviceName
      } (vacbot object)`,
    );
    logger.trace(`Number of registered vacbots : ${this.vacbots.size}.`);
  });
}

module.exports = {
  loadVacbots,
};

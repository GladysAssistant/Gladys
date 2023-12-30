const logger = require('../../../../utils/logger');

/**
 * @description Stops Ecovacs device.
 * @returns {any} Null.
 * @example
 * ecovacs.stop();
 */
async function stop() {
  logger.debug(`Ecovacs: Stopping`);
  const registered = await this.gladys.device.get({
    service_id: this.serviceId,
  });
  registered.forEach(async (device) => {
    const vacbot = await this.getVacbotObj(device.external_id);
    await vacbot.disconnect();
  });
  this.connected = false;
  return null;
}

module.exports = {
  stop,
};

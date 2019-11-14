const logger = require('../../utils/logger');
const MagicDevicesManager = require('./lib');
const MagicDevicesController = require('./api/magicdevices.controller');

module.exports = function MagicDevicesService(gladys, serviceId) {
  const magicDevicesManager = new MagicDevicesManager(gladys, serviceId);
  /**
   * @public
   * @description This function listen event on Magic Devices service
   * @example
   * gladys.services.magicdevices.start();
   */
  async function start() {
    logger.log('Starting Magic Devices service');
    magicDevicesManager.listen();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.magicdevices.stop();
   */
  async function stop() {
    logger.log('Stopping Magic Devices service');
  }

  return Object.freeze({
    start,
    stop,
    controllers: MagicDevicesController(magicDevicesManager),
  });
};

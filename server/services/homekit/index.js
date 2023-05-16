const logger = require('../../utils/logger');
const HomeKitHandler = require('./lib');
const HomeKitController = require('./api/homekit.controller');

module.exports = function HomeKitService(gladys, serviceId) {
  const hap = require('hap-nodejs');

  const homeKitHandler = new HomeKitHandler(gladys, serviceId, hap);

  /**
   * @public
   * @description This function starts the HomeKit service and expose devices.
   * @returns {Promise} Empty promise once service is started.
   * @example
   * gladys.services.homekit.start();
   */
  async function start() {
    logger.info('Starting HomeKit service');
    const dockerBased = await gladys.system.isDocker();
    if (dockerBased) {
      const { basePathOnContainer } = await gladys.system.getGladysBasePath();
      hap.HAPStorage.setCustomStoragePath(`${basePathOnContainer}/homekit`);
    }

    await homeKitHandler.createBridge();
  }

  /**
   * @public
   * @description This function stops the HomeKit service.
   * @example
   * gladys.services.homekit.stop();
   */
  async function stop() {
    logger.info('Stopping HomeKit service');
  }

  return Object.freeze({
    start,
    stop,
    controllers: HomeKitController(homeKitHandler),
  });
};

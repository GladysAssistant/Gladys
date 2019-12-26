// Credit to @jangxx for porting flux_led in node
// https://github.com/jangxx/node-magichome

const logger = require('../../utils/logger');
const MagicDevicesManager = require('./lib');
const MagicDevicesController = require('./api/magicdevices.controller');

module.exports = function MagicDevicesService(gladys, serviceId) {
  const magicDevicesManager = new MagicDevicesManager(gladys, serviceId);
  /**
   * @public
   * @description This function starts the Magic Devices service
   * @example
   * gladys.services.magicdevices.start();
   */
  async function start() {
    logger.log('Starting Magic Devices service');
    magicDevicesManager.start();
  }

  /**
   * @public
   * @description This function stops the Magic Devices service
   * @example
   *  gladys.services.magicdevices.stop();
   */
  async function stop() {
    logger.log('Stopping Magic Devices service');
  }

  return Object.freeze({
    start,
    stop,
    device: magicDevicesManager,
    controllers: MagicDevicesController(magicDevicesManager),
  });
};

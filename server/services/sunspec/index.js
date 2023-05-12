const logger = require('../../utils/logger');
const SunSpecManager = require('./lib');
const SunSpecController = require('./api/sunspec.controller');

module.exports = function SunSpecService(gladys, serviceId) {
  const modbusTCP = require('modbus-serial');

  const sunspecManager = new SunSpecManager(gladys, modbusTCP, serviceId);

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.sunspec.start();
   */
  async function start() {
    logger.log('Starting SunSpec service');
    await sunspecManager.connect();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.sunspec.stop();
   */
  async function stop() {
    logger.info('Stopping SunSpec service');
    await sunspecManager.disconnect();
  }

  /**
   * @public
   * @description Get info if the service is used.
   * @returns {Promise<boolean>} Returns true if the service is used.
   * @example
   * gladys.services.sunspec.isUsed();
   */
  async function isUsed() {
    return sunspecManager.connected && sunspecManager.nodes && sunspecManager.nodes.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: sunspecManager,
    controllers: SunSpecController(gladys, sunspecManager, serviceId),
  });
};

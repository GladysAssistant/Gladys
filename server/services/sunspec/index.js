const logger = require('../../utils/logger');
const SunSpecManager = require('./lib');
const SunSpecController = require('./api/sunspec.controller');

module.exports = function SunSpecService(gladys, serviceId) {
  const modbusTCP = require('modbus-serial');
  const { NmapScan } = require('node-sudo-nmap');

  const sunspecManager = new SunSpecManager(gladys, modbusTCP, NmapScan, serviceId);

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.sunspec.start();
   */
  async function start() {
    logger.log('Starting SunSpec service');
    await sunspecManager.connect();
    const configuration = await sunspecManager.getConfiguration();
    await sunspecManager.bdpvInit(configuration.bdpvActive);
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
    return sunspecManager.connected && sunspecManager.devices && sunspecManager.devices.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: sunspecManager,
    controllers: SunSpecController(sunspecManager),
  });
};

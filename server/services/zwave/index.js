const logger = require('../../utils/logger');
const ZwaveManager = require('./lib');
const ZwaveController = require('./api/zwave.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

module.exports = function ZwaveService(gladys, serviceId) {
  const Zwave = require('openzwave-shared');
  const zwaveManager = new ZwaveManager(Zwave, gladys.event, serviceId);
  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.zwave.start();
   */
  async function start() {
    logger.info('Starting zwave service');
    const zwaveDriverPath = await gladys.variable.getValue('ZWAVE_DRIVER_PATH', serviceId);
    if (!zwaveDriverPath) {
      throw new ServiceNotConfiguredError('ZWAVE_DRIVER_PATH_NOT_FOUND');
    }
    zwaveManager.connect(zwaveDriverPath);
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.zwave.stop();
   */
  async function stop() {
    logger.info('Stopping zwave service');
    zwaveManager.disconnect();
  }

  /**
   * @public
   * @description Get info if the service is used.
   * @returns {Promise<boolean>} Returns true if the service is used.
   * @example
   * gladys.services.zwave.isUsed();
   */
  async function isUsed() {
    return zwaveManager.ready === true && Object.keys(zwaveManager.nodes).length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: zwaveManager,
    controllers: ZwaveController(gladys, zwaveManager, serviceId),
  });
};

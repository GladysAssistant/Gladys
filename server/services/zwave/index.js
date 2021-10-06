const logger = require('../../utils/logger');
const ZwaveManager = require('./lib');
const ZwaveController = require('./api/zwave.controller');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');

module.exports = function ZwaveService(gladys, serviceId) {
  const ZWaveJS = require('zwave-js');

  const zwaveManager = new ZwaveManager(gladys, ZWaveJS, serviceId);
  
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
    await zwaveManager.connect(zwaveDriverPath);
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

  return Object.freeze({
    start,
    stop,
    device: zwaveManager,
    controllers: ZwaveController(gladys, zwaveManager, serviceId),
  });
};

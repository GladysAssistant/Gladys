const logger = require('../../utils/logger');
const ZwaveManager = require('./lib');
const ZwaveController = require('./api/zwave.controller');

module.exports = function ZwaveService(gladys, serviceId) {
  const mqtt = require('mqtt');
  const ZWaveJS = require('zwave-js');

  const zwaveManager = new ZwaveManager(gladys, ZWaveJS, mqtt, serviceId);

  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.zwave.start();
   */
  async function start() {
    logger.log('Starting Zwave service');
    await zwaveManager.connect();
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.zwave.stop();
   */
  async function stop() {
    logger.info('Stopping zwave service');
    await zwaveManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: zwaveManager,
    controllers: ZwaveController(gladys, zwaveManager, serviceId),
  });
};

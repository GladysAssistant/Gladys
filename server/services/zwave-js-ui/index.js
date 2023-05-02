const logger = require('../../utils/logger');
const ZwaveJSUIManager = require('./lib');
const ZwaveJSUIController = require('./api/zwavejsui.controller');

module.exports = function ZwaveJSUIService(gladys, serviceId) {
  const mqtt = require('mqtt');

  const zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, serviceId);

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.zwave-js-ui.start();
   */
  async function start() {
    logger.log('Starting ZwaveJSUI service');
    await zwaveJSUIManager.connect();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.zwave-js-ui.stop();
   */
  async function stop() {
    logger.info('Stopping ZwaveJSUI service');
    await zwaveJSUIManager.disconnect();
  }

  /**
   * @public
   * @description Get info if the service is used.
   * @returns {Promise<boolean>} Returns true if the service is used.
   * @example
   * gladys.services.zwave-js-ui.isUsed();
   */
  async function isUsed() {
    return zwaveJSUIManager.mqttConnected && zwaveJSUIManager.nodes && zwaveJSUIManager.nodes.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: zwaveJSUIManager,
    controllers: ZwaveJSUIController(gladys, zwaveJSUIManager, serviceId),
  });
};

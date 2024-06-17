const logger = require('../../utils/logger');
const ZwaveJSUIHandler = require('./lib');
const zwaveJSUIController = require('./api/zwaveJSUI.controller');

module.exports = function ZwaveJSUIService(gladys, serviceId) {
  const mqtt = require('mqtt');
  const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqtt, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services['zwavejs-ui'].start();
   */
  async function start() {
    logger.info('Starting Z-Wave JS UI service');
    await zwaveJSUIHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['zwavejs-ui'].stop();
   */
  async function stop() {
    logger.info('Stopping Z-Wave JS UI service');
  }

  /**
   * @public
   * @description This function return true if the service is used.
   * @returns {Promise<boolean>} Resolves with a boolean.
   * @example
   *  const isUsed = await gladys.services['zwavejs-ui'].isUsed();
   */
  async function isUsed() {
    return zwaveJSUIHandler.devices.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: zwaveJSUIHandler,
    controllers: zwaveJSUIController(zwaveJSUIHandler),
  });
};

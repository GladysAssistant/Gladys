const logger = require('../../utils/logger');
const MatterbridgeManager = require('./lib');
const MatterbridgeController = require('./api/matterbridge.controller');

module.exports = function MatterbridgeService(gladys, serviceId) {
  const matterbridgeManager = new MatterbridgeManager(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services['matterbridge'].start();
   */
  async function start() {
    logger.log('Starting Matterbridge service');
    await matterbridgeManager.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['matterbridge'].stop();
   */
  function stop() {
    logger.log('Stopping Matterbridge service');
    matterbridgeManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: matterbridgeManager,
    controllers: MatterbridgeController(gladys, matterbridgeManager),
  });
};

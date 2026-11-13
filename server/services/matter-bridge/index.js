const logger = require('../../utils/logger');
const MatterBridge = require('./lib/MatterBridge');
const MatterBridgeController = require('./api/matterBridge.controller');
const { loadMatter } = require('./lib/loadMatter');

module.exports = function MatterBridgeService(gladys, serviceId) {
  const bridge = new MatterBridge(gladys, serviceId, loadMatter);

  /**
   * @public
   * @description Start the Matter bridge, when it is enabled.
   * @returns {Promise} Resolves once the bridge is started.
   * @example
   * gladys.services['matter-bridge'].start();
   */
  async function start() {
    logger.info('Starting Matter bridge service');
    await bridge.start();
  }

  /**
   * @public
   * @description Stop the Matter bridge.
   * @returns {Promise} Resolves once the bridge is stopped.
   * @example
   * gladys.services['matter-bridge'].stop();
   */
  async function stop() {
    logger.info('Stopping Matter bridge service');
    await bridge.stop();
  }

  return Object.freeze({
    start,
    stop,
    bridge,
    controllers: MatterBridgeController(bridge),
  });
};

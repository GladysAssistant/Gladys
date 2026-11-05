const logger = require('../../utils/logger');
const MatterBridge = require('./lib/MatterBridge');
const MatterBridgeController = require('./api/matterBridge.controller');

/**
 * @description Load the matter.js modules. Gladys builds every service at start-up, so they are
 * not required here but when the bridge starts: matter.js sets up its Node.js platform when it is
 * loaded, which only an enabled bridge needs.
 * @returns {object} The matter.js modules: { main, devices, endpoints, behaviors }.
 * @example
 * const matter = loadMatter();
 */
function loadMatter() {
  return {
    main: require('@matter/main'),
    // eslint-plugin-import does not read the "exports" map these sub-paths are declared in.
    // eslint-disable-next-line import/no-unresolved
    devices: require('@matter/main/devices'),
    // eslint-disable-next-line import/no-unresolved
    endpoints: require('@matter/main/endpoints'),
    // eslint-disable-next-line import/no-unresolved
    behaviors: require('@matter/main/behaviors'),
  };
}

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

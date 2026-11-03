const logger = require('../../utils/logger');
const MatterBridge = require('./lib/MatterBridge');
const MatterBridgeController = require('./api/matterBridge.controller');

module.exports = function MatterBridgeService(gladys, serviceId) {
  // Required here rather than at the top of the file: matter.js sets up its Node.js platform when
  // it is loaded, which only an enabled service needs.
  const matter = {
    main: require('@matter/main'),
    // eslint-plugin-import does not read the "exports" map these sub-paths are declared in.
    // eslint-disable-next-line import/no-unresolved
    devices: require('@matter/main/devices'),
    // eslint-disable-next-line import/no-unresolved
    endpoints: require('@matter/main/endpoints'),
    // eslint-disable-next-line import/no-unresolved
    behaviors: require('@matter/main/behaviors'),
  };
  const bridge = new MatterBridge(gladys, serviceId, matter);

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

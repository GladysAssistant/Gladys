const logger = require('../../utils/logger');
const NodeRedManager = require('./lib');
const NodeRedController = require('./api/node-red.controller');

module.exports = function NodeRedService(gladys, serviceId) {
  const nodeRedManager = new NodeRedManager(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services['node-red'].start();
   */
  async function start() {
    logger.log('Starting Node-red service');
    await nodeRedManager.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['node-red'].stop();
   */
  function stop() {
    logger.log('Stopping Node-red service');
    nodeRedManager.disconnect();
  }

  /**
   * @public
   * @description Test if Node-red is running.
   * @returns {Promise<boolean>} Returns true if node-red is used.
   * @example
   *  const used = await gladys.services['node-red'].isUsed();
   */
  async function isUsed() {
    return nodeRedManager.gladysConnected && nodeRedManager.zigbee2mqttConnected;
    // TODO Check if needed
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: nodeRedManager,
    controllers: NodeRedController(gladys, nodeRedManager),
  });
};

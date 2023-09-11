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
    logger.log('Starting Node-RED service');
    await nodeRedManager.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['node-red'].stop();
   */
  function stop() {
    logger.log('Stopping Node-RED service');
    nodeRedManager.disconnect();
  }

  return Object.freeze({
    start,
    stop,
    device: nodeRedManager,
    controllers: NodeRedController(gladys, nodeRedManager),
  });
};

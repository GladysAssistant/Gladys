const logger = require('../../utils/logger');

const AwoxManager = require('./lib');
const AwoxController = require('./api/awox.controller');

module.exports = function AwoxService(gladys, serviceId) {
  const awoxManager = new AwoxManager(gladys, serviceId);

  /**
   * @public
   * @description Starts the AwoX service.
   * @example
   * gladys.services.awox.start();
   */
  async function start() {
    logger.info('Starting AwoX service');
    await awoxManager.start();
  }

  /**
   * @public
   * @description This function stops the AwoX service
   * @example
   * gladys.services.awox.stop();
   */
  async function stop() {
    logger.log('Stopping AwoX service');
    await awoxManager.stop();
  }

  return Object.freeze({
    start,
    stop,
    device: awoxManager,
    controllers: AwoxController(awoxManager),
  });
};

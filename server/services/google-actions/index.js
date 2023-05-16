const logger = require('../../utils/logger');
const GoogleActionsHandler = require('./lib');

module.exports = function GoogleActionsService(gladys, serviceId) {
  const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services['google-actions'].start();
   */
  async function start() {
    logger.info('starting GoogleActions service');
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['google-actions'].stop();
   */
  async function stop() {
    logger.info('stopping GoogleActions service');
  }

  return Object.freeze({
    start,
    stop,
    googleActionsHandler,
  });
};

const logger = require('../../utils/logger');
const GoogleActionsHandler = require('./lib');
const GoogleActionsController = require('./api/googleActions.controller');

module.exports = function GoogleActionsService(gladys, serviceId) {
  const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services['google-actions'].start();
   */
  async function start() {
    logger.info('starting GoogleActions service');
    //  await googleActionsHandler.init();
    logger.info('GoogleActions service well started');
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services['google-actions'].stop();
   */
  async function stop() {
    logger.info('stopping GoogleActions service');
    // await googleActionsHandler.stop();
    logger.info('GoogleActions service well stopped');
  }

  return Object.freeze({
    start,
    stop,
    googleActionsHandler,
    controllers: GoogleActionsController(googleActionsHandler),
  });
};

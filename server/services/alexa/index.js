const logger = require('../../utils/logger');
const AlexaHandler = require('./lib');

module.exports = function AlexaService(gladys, serviceId) {
  const alexaHandler = new AlexaHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services['alexa'].start();
   */
  async function start() {
    logger.info('starting Alexa service');
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['alexa'].stop();
   */
  async function stop() {
    logger.info('stopping Alexa service');
  }

  return Object.freeze({
    start,
    stop,
    alexaHandler,
  });
};

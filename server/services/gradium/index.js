const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const GradiumHandler = require('./lib');
const GradiumController = require('./api/gradium.controller');

module.exports = function GradiumService(gladys, serviceId) {
  let gradiumApiKey;

  const gradiumHandler = new GradiumHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.gradium.start();
   */
  async function start() {
    logger.info('Starting Gradium service');
    gradiumApiKey = await gladys.variable.getValue('GRADIUM_API_KEY', serviceId);
    if (!gradiumApiKey) {
      throw new ServiceNotConfiguredError('Gradium Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.gradium.stop();
   */
  async function stop() {
    logger.info('Stopping Gradium service');
  }

  return Object.freeze({
    start,
    stop,
    controllers: GradiumController(gradiumHandler),
    tts: gradiumHandler,
  });
};

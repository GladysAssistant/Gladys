const logger = require('../../utils/logger');
const tessieController = require('./api/tessie.controller');

const TessieHandler = require('./lib');
const { STATUS } = require('./lib/utils/tessie.constants');

module.exports = function TessieService(gladys, serviceId) {
  const tessieHandler = new TessieHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services.tessie.start();
   */
  async function start() {
    logger.info('Starting Tessie service', serviceId);
    await tessieHandler.init();
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services.tessie.stop();
   */
  async function stop() {
    logger.info('Stopping Tessie service');
    await tessieHandler.disconnect();
  }

  /**
   * @public
   * @description Test if Tessie is running.
   * @returns {Promise<boolean>} Returns true if Tessie is used.
   * @example
   *  const used = await gladys.services.tessie.isUsed();
   */
  async function isUsed() {
    return tessieHandler.status === STATUS.CONNECTED;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: tessieHandler,
    controllers: tessieController(tessieHandler),
  });
};

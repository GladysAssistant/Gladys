const logger = require('../../utils/logger');
const OverkizHandler = require('./lib');
const OverkizController = require('./api/overkiz.controller');
const { OVERKIZ_SERVER_PARAM } = require('./lib/overkiz.constants');

module.exports = function OverkizService(gladys, serviceId) {
  const overkizHandler = new OverkizHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the Overkiz service.
   * @example
   * gladys.services.overkiz.start();
   */
  async function start() {
    logger.info('Starting Overkiz service');

    await gladys.variable.setValue(OVERKIZ_SERVER_PARAM.OVERKIZ_TYPE, 'atlantic_cozytouch', serviceId);
    await gladys.variable.setValue(OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_USERNAME, 'pochet.romuald@gmail.com', serviceId);
    await gladys.variable.setValue(OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_PASSWORD, '8Vyr7acpcozytouch', serviceId);

    await overkizHandler.connect();
  }

  /**
   * @public
   * @description This function stops the Overkiz service.
   * @example
   * gladys.services.overkiz.stop();
   */
  async function stop() {
    logger.info('Stopping Overkiz service');

    await overkizHandler.disconnect();
  }

  /**
   * @public
   * @description Get info if the service is used.
   * @returns {Promise<boolean>} Returns true if the service is used.
   * @example
   * gladys.services.overkiz.isUsed();
   */
  async function isUsed() {
    return true;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: overkizHandler,
    controllers: OverkizController(overkizHandler),
  });
};

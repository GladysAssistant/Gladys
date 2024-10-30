const logger = require('../../utils/logger');
const AirplayHandler = require('./lib');
const airplayController = require('./api/airplay.controller');

module.exports = function AirplayService(gladys, serviceId) {
  const airtunes = require('node-airtunes2');
  const bonjourLib = require('bonjour')();
  const childProcess = require('child_process');
  const airplayHandler = new AirplayHandler(gladys, airtunes, bonjourLib, childProcess, serviceId);

  /**
   * @public
   * @description This function starts the airplay service service.
   * @example
   * gladys.services['airplay'].start();
   */
  async function start() {
    logger.info('Starting Airplay service');
    airplayHandler.init();
  }

  /**
   * @public
   * @description This function stops the airplay service.
   * @example
   *  gladys.services['airplay'].stop();
   */
  async function stop() {
    logger.info('Stopping Airplay service');
  }

  /**
   * @public
   * @description This function return true if the service is used.
   * @returns {Promise<boolean>} Resolves with a boolean.
   * @example
   *  const isUsed = await gladys.services['airplay'].isUsed();
   */
  async function isUsed() {
    return airplayHandler.devices.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: airplayHandler,
    controllers: airplayController(airplayHandler),
  });
};

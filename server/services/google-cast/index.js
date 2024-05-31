const logger = require('../../utils/logger');
const GoogleCastHandler = require('./lib');
const googleCastController = require('./api/google_cast.controller');

module.exports = function GoogleCastService(gladys, serviceId) {
  // @ts-ignore
  const googleCastv2Lib = require('castv2-client');
  const bonjourLib = require('bonjour')();
  const googleCastHandler = new GoogleCastHandler(gladys, googleCastv2Lib, bonjourLib, serviceId);

  /**
   * @public
   * @description This function starts the googleCast service service.
   * @example
   * gladys.services['googleCast'].start();
   */
  async function start() {
    logger.info('Starting GoogleCast service');
    googleCastHandler.init();
  }

  /**
   * @public
   * @description This function stops the googleCast service.
   * @example
   *  gladys.services['googleCast'].stop();
   */
  async function stop() {
    logger.info('Stopping GoogleCast service');
  }

  /**
   * @public
   * @description This function return true if the service is used.
   * @returns {Promise<boolean>} Resolves with a boolean.
   * @example
   *  const isUsed = await gladys.services['googleCast'].isUsed();
   */
  async function isUsed() {
    return googleCastHandler.devices.length > 0;
  }

  return Object.freeze({
    start,
    stop,
    isUsed,
    device: googleCastHandler,
    controllers: googleCastController(googleCastHandler),
  });
};

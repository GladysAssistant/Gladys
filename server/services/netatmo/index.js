const fse = require('fs-extra');
const logger = require('../../utils/logger');
const NetatmoManager = require('./lib');
const NetatmoController = require('./api/netatmo.controller');

module.exports = function NetatmoService(gladys, serviceId) {
  const ffmpeg = require('fluent-ffmpeg');
  const netatmoManager = new NetatmoManager(gladys, ffmpeg, serviceId);
  /**
   * @public
   * @description This function start netatmo service and connect it
   * @example
   * gladys.services.netatmo.start();
   */
  async function start() {
    logger.log('Starting netatmo service');
    netatmoManager.connect();
    await fse.ensureDir(gladys.config.tempFolder);
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services.netatmo.stop();
   */
  async function stop() {
    logger.log('Stopping Netatmo service');
  }

  return Object.freeze({
    start,
    stop,
    device: netatmoManager,
    controllers: NetatmoController(netatmoManager),
  });
};

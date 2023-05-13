const fse = require('fs-extra');
const childProcess = require('child_process');

const logger = require('../../utils/logger');
const RtspCameraHandler = require('./lib');
const RtspCameraController = require('./api/rtspCamera.controller');

module.exports = function RtspCameraService(gladys, serviceId) {
  const ffmpeg = require('fluent-ffmpeg');
  const device = new RtspCameraHandler(gladys, ffmpeg, childProcess, serviceId);
  /**
   * @public
   * @description This function starts service.
   * @example
   * gladys.services['rtsp-camera'].start();
   */
  async function start() {
    logger.info('Starting RTSP service');
    // make sure the tempFolder exists
    await fse.ensureDir(gladys.config.tempFolder);
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   *  gladys.services['rtsp-camera'].stop();
   */
  async function stop() {
    logger.info('Stopping RTSP service');
  }

  return Object.freeze({
    start,
    stop,
    device,
    controllers: RtspCameraController(gladys, device),
  });
};

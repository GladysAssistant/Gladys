const logger = require('../../utils/logger');
const RtspCameraHandler = require('./lib');
const RtspCameraController = require('./api/rtspCamera.controller');

module.exports = function RtspCameraService(gladys, serviceId) {
  const ffmpeg = require('fluent-ffmpeg');
  const device = new RtspCameraHandler(gladys, ffmpeg, serviceId);
  /**
   * @public
   * @description This function starts service
   * @example
   * gladys.services['rtsp-camera'].start();
   */
  async function start() {
    logger.log('starting RTSP service');
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   *  gladys.services['rtsp-camera'].stop();
   */
  async function stop() {
    logger.log('stopping RTSP service');
  }

  return Object.freeze({
    start,
    stop,
    device,
    controllers: RtspCameraController(device),
  });
};

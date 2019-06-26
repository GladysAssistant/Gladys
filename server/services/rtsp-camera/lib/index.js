const { poll } = require('./poll');
const { getImage } = require('./getImage');

/**
 * @description Add ability to connect to RTSP camera.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} ffmpeg - Ffmpeg library.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const rtspCameraHandler = new RtspCameraHandler(gladys, ffmpeg, serviceId);
 */
const RtspCameraHandler = function RtspCameraHandler(gladys, ffmpeg, serviceId) {
  this.gladys = gladys;
  this.ffmpeg = ffmpeg;
  this.serviceId = serviceId;
};

RtspCameraHandler.prototype.poll = poll;
RtspCameraHandler.prototype.getImage = getImage;

module.exports = RtspCameraHandler;

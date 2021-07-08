const { poll } = require('./poll');
const { getImage } = require('./getImage');

/**
 * @description Add ability to connect to RTSP camera.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} ffmpeg - Ffmpeg library.
 * @param {Object} picam - Pi-Camera library.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const rtspCameraHandler = new RtspCameraHandler(gladys, ffmpeg, serviceId);
 */
const RtspCameraHandler = function RtspCameraHandler(gladys, ffmpeg, picam, serviceId) {
  this.gladys = gladys;
  this.ffmpeg = ffmpeg;
  this.picam = picam;
  this.serviceId = serviceId;
};

RtspCameraHandler.prototype.poll = poll;
RtspCameraHandler.prototype.getImage = getImage;

module.exports = RtspCameraHandler;

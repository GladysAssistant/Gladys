const { checkIfLiveActive } = require('./checkIfLiveActive');
const { poll } = require('./poll');
const { getImage } = require('./getImage');
const { liveActivePing } = require('./liveActivePing');
const { startStreaming } = require('./startStreaming');
const { startStreamingIfNotStarted } = require('./startStreamingIfNotStarted');
const { stopStreaming } = require('./stopStreaming');

/**
 * @description Add ability to connect to RTSP camera.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} ffmpeg - Ffmpeg library.
 * @param {Object} childProcess - ChildProcess library.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const rtspCameraHandler = new RtspCameraHandler(gladys, ffmpeg, serviceId);
 */
const RtspCameraHandler = function RtspCameraHandler(gladys, ffmpeg, childProcess, serviceId) {
  this.gladys = gladys;
  this.ffmpeg = ffmpeg;
  this.childProcess = childProcess;
  this.serviceId = serviceId;
  this.checkIfLiveActiveFrequencyInSeconds = 10;
  this.liveStreams = new Map();
  this.liveStreamsStarting = new Map();
};

RtspCameraHandler.prototype.checkIfLiveActive = checkIfLiveActive;
RtspCameraHandler.prototype.poll = poll;
RtspCameraHandler.prototype.getImage = getImage;
RtspCameraHandler.prototype.liveActivePing = liveActivePing;
RtspCameraHandler.prototype.startStreaming = startStreaming;
RtspCameraHandler.prototype.startStreamingIfNotStarted = startStreamingIfNotStarted;
RtspCameraHandler.prototype.stopStreaming = stopStreaming;

module.exports = RtspCameraHandler;

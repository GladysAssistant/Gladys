const { checkIfLiveActive } = require('./checkIfLiveActive');
const { convertLocalStreamToGateway } = require('./convertLocalStreamToGateway');
const { onNewCameraFile } = require('./onNewCameraFile');
const { poll } = require('./poll');
const { getImage } = require('./getImage');
const { liveActivePing } = require('./liveActivePing');
const { sendCameraFileToGateway, sendCameraFileToGatewayLimited } = require('./sendCameraFileToGateway');
const { startStreaming } = require('./startStreaming');
const { startStreamingIfNotStarted } = require('./startStreamingIfNotStarted');
const { stopStreaming } = require('./stopStreaming');

/**
 * @description Add ability to connect to RTSP camera.
 * @param {object} gladys - Gladys instance.
 * @param {object} childProcess - ChildProcess library.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const rtspCameraHandler = new RtspCameraHandler(gladys, childProcess, serviceId);
 */
const RtspCameraHandler = function RtspCameraHandler(gladys, childProcess, serviceId) {
  this.gladys = gladys;
  this.childProcess = childProcess;
  this.serviceId = serviceId;
  this.checkIfLiveActiveFrequencyInSeconds = 10;
  this.liveStreams = new Map();
  this.liveStreamsStarting = new Map();
  this.checkIfLiveActiveInterval = null;
};

RtspCameraHandler.prototype.checkIfLiveActive = checkIfLiveActive;
RtspCameraHandler.prototype.convertLocalStreamToGateway = convertLocalStreamToGateway;
RtspCameraHandler.prototype.onNewCameraFile = onNewCameraFile;
RtspCameraHandler.prototype.poll = poll;
RtspCameraHandler.prototype.getImage = getImage;
RtspCameraHandler.prototype.liveActivePing = liveActivePing;
RtspCameraHandler.prototype.sendCameraFileToGateway = sendCameraFileToGateway;
RtspCameraHandler.prototype.sendCameraFileToGatewayLimited = sendCameraFileToGatewayLimited;
RtspCameraHandler.prototype.startStreaming = startStreaming;
RtspCameraHandler.prototype.startStreamingIfNotStarted = startStreamingIfNotStarted;
RtspCameraHandler.prototype.stopStreaming = stopStreaming;

module.exports = RtspCameraHandler;

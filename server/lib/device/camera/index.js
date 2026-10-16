const { command } = require('./camera.command');
const { setImage } = require('./camera.setImage');
const { getImage } = require('./camera.getImage');
const { get } = require('./camera.get');
const { getImagesInRoom } = require('./camera.getImagesInRoom');
const { INTENTS } = require('../../../utils/constants');
const { getLiveImage } = require('./camera.getLiveImage');
const { startWebRtc, pingWebRtc, stopWebRtc, endWebRtcSession, sweepWebRtcSessions } = require('./camera.webRtc');

const Camera = function Camera(stateManager, messageManager, eventManager, serviceManager, deviceManager) {
  this.stateManager = stateManager;
  this.messageManager = messageManager;
  this.eventManager = eventManager;
  this.serviceManager = serviceManager;
  this.deviceManager = deviceManager;
  // WebRTC live views in progress, by session id (camera.webRtc.js)
  this.webRtcSessions = new Map();
  this.webRtcSweepInterval = null;
  this.eventManager.on(INTENTS.CAMERA.GET_IMAGE, this.command.bind(this));
};

Camera.prototype.command = command;
Camera.prototype.setImage = setImage;
Camera.prototype.getImage = getImage;
Camera.prototype.get = get;
Camera.prototype.getImagesInRoom = getImagesInRoom;
Camera.prototype.getLiveImage = getLiveImage;
Camera.prototype.startWebRtc = startWebRtc;
Camera.prototype.pingWebRtc = pingWebRtc;
Camera.prototype.stopWebRtc = stopWebRtc;
Camera.prototype.endWebRtcSession = endWebRtcSession;
Camera.prototype.sweepWebRtcSessions = sweepWebRtcSessions;

module.exports = Camera;

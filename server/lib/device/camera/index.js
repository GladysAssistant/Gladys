const { command } = require('./camera.command');
const { setImage } = require('./camera.setImage');
const { getImage } = require('./camera.getImage');
const { get } = require('./camera.get');
const { getImageInRoom } = require('./camera.getImageInRoom');
const { INTENTS } = require('../../../utils/constants');
const { getLiveImage } = require('./camera.getLiveImage');

const Camera = function Camera(stateManager, messageManager, eventManager, serviceManager, deviceManager) {
  this.stateManager = stateManager;
  this.messageManager = messageManager;
  this.eventManager = eventManager;
  this.serviceManager = serviceManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.CAMERA.GET_IMAGE_ROOM, this.command.bind(this));
};

Camera.prototype.command = command;
Camera.prototype.setImage = setImage;
Camera.prototype.getImage = getImage;
Camera.prototype.get = get;
Camera.prototype.getImageInRoom = getImageInRoom;
Camera.prototype.getLiveImage = getLiveImage;

module.exports = Camera;

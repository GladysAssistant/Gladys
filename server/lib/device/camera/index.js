const { command } = require('./camera.command');
const { setImage } = require('./camera.setImage');
const { getImage } = require('./camera.getImage');
const { get } = require('./camera.get');
const { getImageInRoom } = require('./camera.getImageInRoom');
const { INTENTS } = require('../../../utils/constants');

const Camera = function Camera(stateManager, messageManager, eventManager, deviceManager) {
  this.stateManager = stateManager;
  this.messageManager = messageManager;
  this.eventManager = eventManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.CAMERA.GET_IMAGE_ROOM, this.command.bind(this));
};

Camera.prototype.command = command;
Camera.prototype.setImage = setImage;
Camera.prototype.getImage = getImage;
Camera.prototype.get = get;
Camera.prototype.getImageInRoom = getImageInRoom;

module.exports = Camera;

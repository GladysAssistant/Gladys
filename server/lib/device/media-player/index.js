const { INTENTS } = require('../../../utils/constants');
const { buildMediaPlayerObject } = require('./media-player.buildMediaPlayerObject');
const { command } = require('./media-player.command');
const { init } = require('./media-player.init');
const { getDevice } = require('./media-player.getDevice');
const { get } = require('./media-player.get');
const { turnOn } = require('./media-player.turnOn');
const { turnOff } = require('./media-player.turnOff');

const MediaPlayerManager = function MediaPlayerManager(eventManager, messageManager, deviceManager) {
  this.eventManager = eventManager;
  this.messageManager = messageManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.MEDIA_PLAYER.TURN_ON, this.command.bind(this));
  this.eventManager.on(INTENTS.MEDIA_PLAYER.TURN_OFF, this.command.bind(this));
};

MediaPlayerManager.prototype.buildMediaPlayerObject = buildMediaPlayerObject;
MediaPlayerManager.prototype.command = command;
MediaPlayerManager.prototype.init = init;
MediaPlayerManager.prototype.get = get;
MediaPlayerManager.prototype.getDevice = getDevice;
MediaPlayerManager.prototype.turnOn = turnOn;
MediaPlayerManager.prototype.turnOff = turnOff;

module.exports = MediaPlayerManager;

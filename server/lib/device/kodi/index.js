const { INTENTS } = require('../../../utils/constants');
const { command } = require('./kodi.command');
const { getKodiInRoom } = require('./kodi.getKodiInRoom');
const { getKodiDefault } = require('./kodi.getKodiDefault');

const KodiManager = function KodiManager(eventManager, messageManager, deviceManager) {
  this.eventManager = eventManager;
  this.messageManager = messageManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.KODI.PING, this.command.bind(this));
  this.eventManager.on(INTENTS.KODI.MUTE, this.command.bind(this));
  this.eventManager.on(INTENTS.KODI.UNMUTE, this.command.bind(this));
};

KodiManager.prototype.command = command;
KodiManager.prototype.getKodiInRoom = getKodiInRoom;
KodiManager.prototype.getKodiDefault = getKodiDefault;

module.exports = KodiManager;

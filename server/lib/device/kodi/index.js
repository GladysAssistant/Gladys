const { INTENTS } = require('../../../utils/constants');
const { command } = require('./kodi.command');
const { getKodiInRoom } = require('./kodi.getKodiInRoom');
const { getKodiDefault } = require('./kodi.getKodiDefault');
const { ping } = require('./kodi.ping');

const KodiManager = function KodiManager(eventManager, messageManager, deviceManager) {
  this.eventManager = eventManager;
  this.messageManager = messageManager;
  this.deviceManager = deviceManager;
  this.eventManager.on(INTENTS.KODI.PING, this.command.bind(this));
};

KodiManager.prototype.command = command;
KodiManager.prototype.getKodiInRoom = getKodiInRoom;
KodiManager.prototype.getKodiDefault = getKodiDefault;
KodiManager.prototype.ping = ping;

module.exports = KodiManager;

const { fake } = require('sinon');
const EventEmitter = require('events');
const { EVENTS } = require('../../../utils/constants');

const KodiHandler = function KodiHandler(gladys, eventManager, serviceId) { 
  this.gladys = gladys;
  this.serviceId = serviceId;
  // Map of all kodi connection by device_id
  this.mapOfKodiConnection = new Map();

  // Configure event
  this.eventManager = Object.create(new EventEmitter());
  KodiHandler.prototype = eventManager;
  this.eventManager.on(EVENTS.KODI.PING, this.pingKodi.bind(this));
  this.eventManager.on(EVENTS.KODI.MUTE, this.mute.bind(this));
  this.eventManager.on(EVENTS.KODI.UNMUTE, this.unmute.bind(this));
  this.eventManager.on(EVENTS.KODI.PLAYER.PLAY, this.playPlayer.bind(this));
  this.eventManager.on(EVENTS.KODI.PLAYER.STOP, this.stopPlayer.bind(this));
  this.eventManager.on(EVENTS.KODI.VOLUME.SET, this.setVolume.bind(this));
  this.eventManager.on(EVENTS.KODI.VOLUME.INCREASE, this.increaseVolume.bind(this));
  this.eventManager.on(EVENTS.KODI.VOLUME.DECREASE, this.decreaseVolume.bind(this));
  this.eventManager.on(EVENTS.KODI.MOVIES.GET.ALL, this.getMovies.bind(this));
  this.eventManager.on(EVENTS.KODI.MOVIES.GET.BYNAME, this.getMoviesByTitle.bind(this));
  this.eventManager.on(EVENTS.KODI.MOVIES.OPEN, this.openMedia.bind(this));

};

// COMMANDS
KodiHandler.prototype.connect = fake.returns(null);
KodiHandler.prototype.disconnect = fake.returns(null);
KodiHandler.prototype.checkConnectionAndServerSate = fake.returns(null);
KodiHandler.prototype.checkConnection = fake.returns(null);
KodiHandler.prototype.pingKodi = fake.returns(null);
KodiHandler.prototype.getFirstPlayerId = fake.returns(null);

KodiHandler.prototype.mute = fake.returns(null);
KodiHandler.prototype.unmute = fake.returns(null);
KodiHandler.prototype.playPlayer = fake.returns(null);
KodiHandler.prototype.stopPlayer = fake.returns(null);
KodiHandler.prototype.setVolume = fake.returns(null);
KodiHandler.prototype.increaseVolume = fake.returns(null);
KodiHandler.prototype.decreaseVolume = fake.returns(null);

KodiHandler.prototype.getMovies = fake.returns(null);
KodiHandler.prototype.getMoviesByTitle = fake.returns(null);
KodiHandler.prototype.openMedia = fake.returns(null);

module.exports = KodiHandler;

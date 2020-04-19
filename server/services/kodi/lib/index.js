const EventEmitter = require('events');
const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

// COMMANDS
const { connect } = require('./utils/kodi.connect');
const { disconnect } = require('./utils/kodi.disconnect');
const { checkConnectionAndServerSate } = require('./utils/kodi.checkConnectionAndServerSate');
const { checkConnection } = require('./utils/kodi.checkConnection');
const { pingKodi } = require('./utils/kodi.pingKodi');
const { getFirstPlayerId } = require('./utils/kodi.getFirstPlayerId');

const { mute } = require('./commands/kodi.mute');
const { unmute } = require('./commands/kodi.unmute');
const { playPlayer } = require('./commands/kodi.playPlayer');
const { stopPlayer } = require('./commands/kodi.stopPlayer');
const { setVolume } = require('./commands/kodi.setVolume');
const { increaseVolume } = require('./commands/kodi.increaseVolume');
const { decreaseVolume } = require('./commands/kodi.decreaseVolume');

const { getMovies } = require('./commands/movie/kodi.getMovies');
const { getMoviesByTitle } = require('./commands/movie/kodi.getMoviesByTitle');
const { openMedia } = require('./commands/movie/kodi.openMedia');

// const { command } = require('./commands/kodi.command');
// const { movie } = require('./commands/kodi.movie');

/**
 * @param {Object} gladys - The gladys object.
 * @param {Object} eventManager - The gladys event manager object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * const kodiManager = KodiManager(gladys, serviceId)
 */
const KodiHandler = function KodiHandler(gladys, eventManager, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  // Map of all kodi connection by deviceId
  this.mapOfKodiConnection = new Map();

  // Configure event
  if( this.eventManager ){
      this.eventManager = eventManager;
  }else{
    this.eventManager = Object.create(new EventEmitter());
  }
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

  logger.debug(`'KodiHandler: serviceId = ${serviceId} '`);
};

// COMMANDS
KodiHandler.prototype.connect = connect;
KodiHandler.prototype.disconnect = disconnect;
KodiHandler.prototype.checkConnectionAndServerSate = checkConnectionAndServerSate;
KodiHandler.prototype.checkConnection = checkConnection;
KodiHandler.prototype.pingKodi = pingKodi;
KodiHandler.prototype.getFirstPlayerId = getFirstPlayerId;

KodiHandler.prototype.mute = mute;
KodiHandler.prototype.unmute = unmute;
KodiHandler.prototype.playPlayer = playPlayer;
KodiHandler.prototype.stopPlayer = stopPlayer;
KodiHandler.prototype.setVolume = setVolume;
KodiHandler.prototype.increaseVolume = increaseVolume;
KodiHandler.prototype.decreaseVolume = decreaseVolume;

KodiHandler.prototype.getMovies = getMovies;
KodiHandler.prototype.getMoviesByTitle = getMoviesByTitle;
KodiHandler.prototype.openMedia = openMedia;

module.exports = KodiHandler;

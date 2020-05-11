const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

// COMMANDS
const { disconnect } = require('./utils/kodi.disconnect');
const { checkConnectionAndServerSate } = require('./utils/kodi.checkConnectionAndServerSate');
const { checkConnection } = require('./utils/kodi.checkConnection');
const { pingKodi } = require('./utils/kodi.pingKodi');
const { poll } = require('./utils/kodi.poll');
const { testKodiConnection } = require('./utils/kodi.testKodiConnection');

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

/**
 * @param {Object} gladys - The gladys object.
 * @param {Object} eventManager - The gladys event manager object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * (only connect function is not define here for compatibility with mock handler for) test)
 * @example
 * const kodiManager = KodiManager(gladys, serviceId)
 */
const CommonKodiHandler = function CommonKodiHandler(gladys, eventManager, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  // Map of all kodi connection by deviceId
  this.mapOfKodiConnection = new Map();

  // Configure event
  this.eventManager = eventManager;
  if (this.eventManager) {
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
  }

  logger.debug(`'KodiHandler: serviceId = ${serviceId} '`);
};

// COMMANDS
CommonKodiHandler.prototype.disconnect = disconnect;
CommonKodiHandler.prototype.checkConnectionAndServerSate = checkConnectionAndServerSate;
CommonKodiHandler.prototype.checkConnection = checkConnection;
CommonKodiHandler.prototype.pingKodi = pingKodi;
CommonKodiHandler.prototype.poll = poll;
CommonKodiHandler.prototype.testKodiConnection = testKodiConnection;

CommonKodiHandler.prototype.getFirstPlayerId = getFirstPlayerId;

CommonKodiHandler.prototype.mute = mute;
CommonKodiHandler.prototype.unmute = unmute;
CommonKodiHandler.prototype.playPlayer = playPlayer;
CommonKodiHandler.prototype.stopPlayer = stopPlayer;
CommonKodiHandler.prototype.setVolume = setVolume;
CommonKodiHandler.prototype.increaseVolume = increaseVolume;
CommonKodiHandler.prototype.decreaseVolume = decreaseVolume;

CommonKodiHandler.prototype.getMovies = getMovies;
CommonKodiHandler.prototype.getMoviesByTitle = getMoviesByTitle;
CommonKodiHandler.prototype.openMedia = openMedia;

module.exports = CommonKodiHandler;

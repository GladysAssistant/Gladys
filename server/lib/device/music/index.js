const { getCapabilities } = require('./music.getCapabilities');
const { browse } = require('./music.browse');
const { search } = require('./music.search');
const { play } = require('./music.play');
const { getQueue } = require('./music.getQueue');
const { playQueueItem } = require('./music.playQueueItem');
const { getArtwork } = require('./music.getArtwork');
const { getPlayer } = require('./music.getPlayer');

/**
 * @description The music players of the instance (capabilities/music.md): the
 * on-demand catalog, queue and artwork of a player, relayed to the external
 * integration owning it. The "now playing" itself is a set of device features
 * saved through the standard state paths; this manager only carries what is
 * never stored.
 * @param {object} stateManager - The state manager.
 * @param {object} serviceManager - The service manager.
 * @example
 * const music = new Music(stateManager, serviceManager);
 */
const Music = function Music(stateManager, serviceManager) {
  this.stateManager = stateManager;
  this.serviceManager = serviceManager;
};

Music.prototype.getPlayer = getPlayer;
Music.prototype.getCapabilities = getCapabilities;
Music.prototype.browse = browse;
Music.prototype.search = search;
Music.prototype.play = play;
Music.prototype.getQueue = getQueue;
Music.prototype.playQueueItem = playQueueItem;
Music.prototype.getArtwork = getArtwork;

module.exports = Music;

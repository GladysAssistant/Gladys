const { init } = require('./musicFile.init');
const { parsePlaylist } = require('./utils/musicFile.parsePlaylist');
const { buildPlayQuery } = require('./utils/musicFile.buildPlayQuery');
const { createPlayQuery } = require('./utils/musicFile.createPlayQuery');
const { getReadStream } = require('./musicFile.getReadStream');
const { play } = require('./musicFile.play');
const { next } = require('./musicFile.next');
const { previous } = require('./musicFile.previous');
const { random } = require('./musicFile.random');
const { getPlaylists } = require('./musicFile.getPlaylists');
const { getCapabilities } = require('./musicFile.getCapabilities');

const { MUSIC } = require('../../../utils/constants');

/**
 * @description Add ability to load music file from lacal hard disk.
 * @param {object} gladys - Gladys instance.
 * @example
 * const musicFileHandler =
 *    new MusicFileHandler(gladys, serviceId, defaultFolder, readSubDirectory);
 */
const MusicFileHandler = function MusicFileHandler(gladys) {
  this.providerType = 'FILE';
  this.gladys = gladys;
  this.defaultFolder = undefined;
  this.readSubDirectory = MUSIC.PROVIDER.STATUS.DISABLED;
  this.playlistFiles = [];
  this.musicQueryBySpeakerOutputName = new Map();
};

// MusicFile functions
MusicFileHandler.prototype.init = init;
MusicFileHandler.prototype.getReadStream = getReadStream;
MusicFileHandler.prototype.buildPlayQuery = buildPlayQuery;
MusicFileHandler.prototype.createPlayQuery = createPlayQuery;
MusicFileHandler.prototype.parsePlaylist = parsePlaylist;
MusicFileHandler.prototype.play = play;
MusicFileHandler.prototype.next = next;
MusicFileHandler.prototype.previous = previous;
MusicFileHandler.prototype.random = random;
MusicFileHandler.prototype.getPlaylists = getPlaylists;
MusicFileHandler.prototype.getCapabilities = getCapabilities;

module.exports = MusicFileHandler;

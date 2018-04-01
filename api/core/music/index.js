
/**
 * @public
 * @name Music
 * @class
 */

module.exports.command = require('./music.command.js');
module.exports.flushQueue = require('./music.flushQueue.js');
module.exports.getCurrentTrack = require('./music.getCurrentTrack.js');
module.exports.getQueue = require('./music.getQueue.js');
module.exports.getMuted = require('./music.getMuted.js');
module.exports.getPlaying = require('./music.getPlaying.js');
module.exports.getPlaylists = require('./music.getPlaylists.js');
module.exports.getVolume = require('./music.getVolume.js');
module.exports.next = require('./music.next.js');
module.exports.pause = require('./music.pause.js');
module.exports.play = require('./music.play.js');
module.exports.playPlaylist = require('./music.playPlaylist.js');
module.exports.previous = require('./music.previous.js');
module.exports.queue = require('./music.queue.js');
module.exports.setMuted = require('./music.setMuted.js');
module.exports.setVolume = require('./music.setVolume.js');
module.exports.stop = require('./music.stop.js');
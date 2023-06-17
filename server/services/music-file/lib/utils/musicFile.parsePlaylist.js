const fs = require('fs');
const { M3uParser } = require('m3u-parser-generator');
const logger = require('../../../../utils/logger');

/**
 * @description Parse m3u playlist file.
 * @param {string} path - File path of m3u playlist to parse .
 * @returns {object} Parsed playlist.
 * @example
 * parsePlaylist(music);
 */
async function parsePlaylist(path) {
  const playlistFileData = await fs.readFileSync(path, 'utf8');
  const playlist = M3uParser.parse(playlistFileData);

  logger.trace(playlist);

  return playlist;
}

module.exports = {
  parsePlaylist,
};

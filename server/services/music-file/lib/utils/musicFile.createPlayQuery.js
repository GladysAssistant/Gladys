const { MUSICFILE } = require('./musicFile.constants');

/**
 * @description Ceate new music query for play song with current music query and a playlist array.
 * @param {string} queryType - Type of music query.
 * @param {string} speakerOutputName - Speaker output name to play music.
 * @param {string} path - Path of file to read.
 * @param {number} currentPlaylistIndex - Current playlist index.
 * @param {number} volumeLevel - Volume level.
 * @param {object} playlist - M3U playlist object.
 * @param {boolean} random - Flag to enable random playing.
 * @returns {object} Return a music query for next music file in playlist.
 * @example
 * createPlayQuery('play', 1, 0.8, playlist, false);
 */
function createPlayQuery(queryType, speakerOutputName, path, currentPlaylistIndex, volumeLevel, playlist, random) {
  const musicFileDesc = {
    eventType: queryType,
    speakerOutputName,
    provider: MUSICFILE.SERVICE_NAME,
    providerType: MUSICFILE.PROVIDER_TYPE,
    path,
    currentPlaylistIndex:
      typeof currentPlaylistIndex !== 'number' || currentPlaylistIndex < 0 ? 0 : currentPlaylistIndex,
    volumeLevel,
    playlist,
    random,
  };

  return musicFileDesc;
}

module.exports = {
  createPlayQuery,
};

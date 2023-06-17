const fs = require('fs');
const path = require('path');
const logger = require('../../../../utils/logger');

/**
 * @description Build a music query for play song with current music query and a playlist array.
 * @param {object} music - Current music query.
 * @param {object} playlist - M3U playlist object.
 * @param {number} playlistIndexIncrement - Increment to add to current playlist index (default: 1).
 * @returns {object} Return a music query for next music file in playlist.
 * @example
 * buildPlayQuery(music, playlist);
 */
async function buildPlayQuery(music, playlist, playlistIndexIncrement) {
  // In case of playlist build first song query
  let playlistParsed;
  if (path.extname(music.path).toLowerCase() === '.m3u') {
    // In this case the request concern a playlist file
    logger.debug(`Build query from playlist ${music.path} (for local provider)`);
    playlistParsed = await this.parsePlaylist(music.path);
  } else {
    playlistParsed = playlist;
  }

  if (playlistParsed && playlistParsed.medias && playlistParsed.medias.length > 0) {
    // Fix playlist index
    let { currentPlaylistIndex } = music;
    if (music.random) {
      currentPlaylistIndex = Math.floor(Math.random() * playlistParsed.medias.length);
    } else {
      currentPlaylistIndex += typeof playlistIndexIncrement !== 'number' ? 1 : playlistIndexIncrement;
    }
    if (currentPlaylistIndex < 0) {
      currentPlaylistIndex = 0;
    }

    let musicFilepath;
    if (playlistParsed.medias[currentPlaylistIndex] && playlistParsed.medias[currentPlaylistIndex].location) {
      let filePath = await decodeURIComponent(playlistParsed.medias[currentPlaylistIndex].location);
      filePath = filePath.replace('file://', '');

      if (fs.existsSync(filePath)) {
        // In this case it's an absolute path in m3u file
        musicFilepath = filePath;
      } else {
        // In this case it's a relative path in m3u file
        const dirPath = path.dirname(music.path);
        filePath = await decodeURIComponent(`${dirPath}/${playlistParsed.medias[currentPlaylistIndex].location}`);
        if (filePath && fs.existsSync(filePath.trim())) {
          musicFilepath = filePath;
        }
      }
    }

    const musicFileDesc = this.createPlayQuery(
      music.type,
      music.speakerOutputName,
      musicFilepath,
      currentPlaylistIndex,
      music.volumeLevel,
      playlistParsed,
      music.random,
    );
    logger.trace(musicFileDesc);
    return musicFileDesc;
  }
  return null;
}

module.exports = {
  buildPlayQuery,
};

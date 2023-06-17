const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Play music playlist file.
 * @param {string} speakerOutputName - Speaker output name to play music.
 * @param {string} playlist - Playlist to read.
 * @param {number} volumeLevel - Volume level.
 * @example
 * play('default', 'MyPlaylist.m3u');
 */
async function play(speakerOutputName, playlist, volumeLevel) {
  if (playlist) {
    try {
      const playlistPath = this.playlistFiles.filter((element) => element.value === playlist);
      if (playlistPath && playlistPath.length > 0) {
        // Build speaker query from playlist
        const musicQuery = await this.buildPlayQuery({
          type: EVENTS.MUSIC.PLAY,
          speakerOutputName,
          path: playlistPath[0].path,
          currentPlaylistIndex: -1,
          volumeLevel,
          random: false,
        });

        if (musicQuery) {
          this.musicQueryBySpeakerOutputName.set(speakerOutputName, musicQuery);
          this.gladys.event.emit(WEBSOCKET_MESSAGE_TYPES.MUSIC.PLAY, musicQuery);
        }
      }
    } catch (e) {
      logger.warn(e);
    }
  }
}

module.exports = {
  play,
};

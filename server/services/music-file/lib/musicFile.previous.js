const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Play previous sound in playlist.
 * @param {string} speakerOutputName - Speaker output name to play music.
 * @example
 * previous('default');
 */
async function previous(speakerOutputName) {
  const currentMusicQuery = this.musicQueryBySpeakerOutputName.get(speakerOutputName);
  if (currentMusicQuery) {
    // Build speaker query from playlist
    currentMusicQuery.type = EVENTS.MUSIC.PREVIOUS;
    const musicQuery = await this.buildPlayQuery(currentMusicQuery, currentMusicQuery.playlist, -1);

    if (musicQuery) {
      this.musicQueryBySpeakerOutputName.set(speakerOutputName, musicQuery);
      this.gladys.event.emit(WEBSOCKET_MESSAGE_TYPES.MUSIC.PLAY, musicQuery);
    }
  }
}

module.exports = {
  previous,
};

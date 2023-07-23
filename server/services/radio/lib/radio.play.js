const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { RADIO } = require('./utils/radio.constants');

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
      if (playlist) {
        // Build speaker query from station uuid
        const station = await this.getStationByStationUUID(playlist);

        const musicQuery = {
          eventType: EVENTS.MUSIC.PLAY,
          provider: RADIO.SERVICE_NAME,
          speakerOutputName,
          providerType: this.providerType,
          volumeLevel,
          playlist,
          path: station.url,
        };

        this.gladys.event.emit(WEBSOCKET_MESSAGE_TYPES.MUSIC.PLAY, musicQuery);
      }
    } catch (e) {
      logger.warn(e);
    }
  }
}

module.exports = {
  play,
};

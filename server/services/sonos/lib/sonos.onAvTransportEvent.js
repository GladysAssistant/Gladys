const { EVENTS, MUSIC_PLAYBACK_STATE } = require('../../../utils/constants');

const SONOS_PLAYBACK_STATES = {
  PLAYING: 'PLAYING',
  PAUSED_PLAYBACK: 'PAUSED_PLAYBACK',
};

/**
 * @description When the playback state change.
 * @param {string} deviceUuid - Sonos internal UUID.
 * @param {object} data - Sonos event.
 * @example onAvTransportEvent('toto', data);
 */
async function onAvTransportEvent(deviceUuid, data) {
  if (
    data.TransportState === SONOS_PLAYBACK_STATES.PLAYING ||
    data.TransportState === SONOS_PLAYBACK_STATES.PAUSED_PLAYBACK
  ) {
    const playBackState =
      data.TransportState === SONOS_PLAYBACK_STATES.PLAYING
        ? MUSIC_PLAYBACK_STATE.PLAYING
        : MUSIC_PLAYBACK_STATE.PAUSED;

    const newState = {
      device_feature_external_id: `sonos:${deviceUuid}:playback-state`,
      state: playBackState,
    };
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
  }
}

module.exports = {
  onAvTransportEvent,
};

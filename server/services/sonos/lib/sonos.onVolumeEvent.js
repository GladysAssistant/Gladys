const { EVENTS } = require('../../../utils/constants');

/**
 * @description When the volume change.
 * @param {string} deviceUuid - Sonos internal UUID.
 * @param {number} volume - Sonos volume level.
 * @example onAvTransportEvent('toto', data);
 */
async function onVolumeEvent(deviceUuid, volume) {
  const newState = {
    device_feature_external_id: `sonos:${deviceUuid}:volume`,
    state: volume,
  };
  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
}

module.exports = {
  onVolumeEvent,
};

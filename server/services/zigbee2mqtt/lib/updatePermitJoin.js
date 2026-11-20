const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Keep whether joining is allowed and until when, as Zigbee2mqtt tells them (or as Gladys forgets them),
 * and broadcast a change (docs/specs/zigbee2mqtt-pairing.md, B). Joining that opens starts a new pairing session: the
 * devices seen joining before are forgotten.
 * @param {boolean} allowed - Whether joining is allowed.
 * @param {number} [end] - When joining closes, epoch in ms; ignored when not allowed.
 * @example
 * updatePermitJoin(true, Date.now() + 254000);
 */
function updatePermitJoin(allowed, end) {
  const permitJoinEnd = allowed && Number.isFinite(end) ? end : null;
  if (allowed === this.z2mPermitJoin && permitJoinEnd === this.z2mPermitJoinEnd) {
    return;
  }
  const opened = allowed && !this.z2mPermitJoin;
  this.z2mPermitJoin = allowed;
  this.z2mPermitJoinEnd = permitJoinEnd;
  if (opened) {
    this.clearPairingDevices();
  }
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
    payload: this.getPermitJoin(),
  });
}

module.exports = {
  updatePermitJoin,
};

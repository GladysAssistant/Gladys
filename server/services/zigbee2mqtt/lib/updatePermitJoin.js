const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { PERMIT_JOIN_MAX_SECONDS } = require('./constants');

/**
 * @description Whether an end told by Zigbee2mqtt can be compared with the clock of Gladys: the one of an external
 * Zigbee2mqtt whose host clock differs is not (docs/specs/zigbee2mqtt-pairing.md, B.1).
 * @param {number} end - Epoch in ms.
 * @returns {boolean} True when it falls within a joining window from now.
 * @example
 * isPlausibleEnd(Date.now() + 254000); // true
 */
function isPlausibleEnd(end) {
  const now = Date.now();
  return Number.isFinite(end) && end >= now - 2000 && end <= now + (PERMIT_JOIN_MAX_SECONDS + 2) * 1000;
}

/**
 * @description Keep whether joining is allowed and until when, as Zigbee2mqtt tells them (or as Gladys forgets them),
 * and broadcast a change (docs/specs/zigbee2mqtt-pairing.md, B). A window that opens starts a new pairing session: the
 * devices seen joining before are forgotten. Not the window Gladys saw open already, told again once Gladys forgot it
 * (the retained bridge/info replayed after a reconnection or an init).
 * @param {boolean} allowed - Whether joining is allowed.
 * @param {number} [end] - When joining closes, epoch in ms; ignored when not allowed. Without a usable one (Zigbee2mqtt
 * 1, another clock), the end already known for the open window is kept.
 * @example
 * updatePermitJoin(true, Date.now() + 254000);
 */
function updatePermitJoin(allowed, end) {
  let permitJoinEnd = null;
  if (allowed && isPlausibleEnd(end)) {
    permitJoinEnd = end;
  } else if (allowed && this.z2mPermitJoin) {
    permitJoinEnd = this.z2mPermitJoinEnd;
  }
  if (allowed === this.z2mPermitJoin && permitJoinEnd === this.z2mPermitJoinEnd) {
    return;
  }
  const opened = allowed && !this.z2mPermitJoin && permitJoinEnd !== this.lastPermitJoinEnd;
  this.z2mPermitJoin = allowed;
  this.z2mPermitJoinEnd = permitJoinEnd;
  if (allowed) {
    this.lastPermitJoinEnd = permitJoinEnd;
  }
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

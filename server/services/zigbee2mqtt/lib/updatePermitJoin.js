const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { PERMIT_JOIN_MAX_SECONDS } = require('./constants');

// Two ends this close are the ones of the same window: the estimate of a response and the end Zigbee2mqtt tells
const SAME_WINDOW_TOLERANCE_IN_MS = 5000;

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
 * @description Whether two ends are the ones of the same window.
 * @param {number|null} end - An end, epoch in ms.
 * @param {number|null} otherEnd - Another one.
 * @returns {boolean} True when both are known and close.
 * @example
 * isSameEnd(1000, 3000); // true
 */
function isSameEnd(end, otherEnd) {
  return end !== null && otherEnd !== null && Math.abs(end - otherEnd) <= SAME_WINDOW_TOLERANCE_IN_MS;
}

/**
 * @description Keep whether joining is allowed and until when, as Zigbee2mqtt tells them (or as Gladys forgets them),
 * and broadcast a change (docs/specs/zigbee2mqtt-pairing.md, B and C.2). A window that opens starts a new pairing
 * session: the devices seen joining before are forgotten. Not the window Gladys saw open and Zigbee2mqtt has not told
 * closed since, told again once Gladys forgot it (the retained bridge/info replayed after a reconnection or an init),
 * whatever its end says (another clock, none with Zigbee2mqtt 1).
 * @param {boolean} allowed - Whether joining is allowed.
 * @param {number} [end] - When joining closes, epoch in ms; ignored when not allowed. Without a usable one (Zigbee2mqtt
 * 1, another clock), the end already known for the window is kept.
 * @param {object} [options] - `estimated`: the end is the estimate of a response, the exact one told by bridge/info is
 * kept; `forgotten`: Gladys forgets joining (init), Zigbee2mqtt did not close it.
 * @example
 * updatePermitJoin(true, Date.now() + 254000);
 */
function updatePermitJoin(allowed, end, options = {}) {
  const { estimated = false, forgotten = false } = options;
  const usableEnd = isPlausibleEnd(end) ? end : null;
  const sameWindow = this.permitJoinWindowSeen;
  const lastWindowRunning = this.lastPermitJoinEnd !== null && this.lastPermitJoinEnd > Date.now();
  let permitJoinEnd = null;
  if (
    allowed &&
    usableEnd !== null &&
    !(estimated && this.z2mPermitJoin && isSameEnd(usableEnd, this.z2mPermitJoinEnd))
  ) {
    permitJoinEnd = usableEnd;
  } else if (allowed && this.z2mPermitJoin) {
    permitJoinEnd = this.z2mPermitJoinEnd;
  } else if (allowed && sameWindow && lastWindowRunning) {
    permitJoinEnd = this.lastPermitJoinEnd;
  }
  // Closed by Zigbee2mqtt (or Gladys gone): the next window is a new one
  if (!allowed && !forgotten) {
    this.permitJoinWindowSeen = false;
    this.lastPermitJoinEnd = null;
  }
  if (allowed) {
    this.permitJoinWindowSeen = true;
  }
  if (allowed === this.z2mPermitJoin && permitJoinEnd === this.z2mPermitJoinEnd) {
    return;
  }
  const opened = allowed && !this.z2mPermitJoin && !sameWindow;
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

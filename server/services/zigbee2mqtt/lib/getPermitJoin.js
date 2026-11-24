const { PERMIT_JOIN_MAX_SECONDS } = require('./constants');

/**
 * @description Whether Zigbee2mqtt allows new devices to join, and for how long still
 * (docs/specs/zigbee2mqtt-pairing.md, B.2). A number of seconds, not an end: the clocks of the browser and of the
 * server never meet.
 * @returns {object} `{ allowed, remainingSeconds }`, `remainingSeconds` null when closed or when the end is unknown.
 * @example
 * getPermitJoin(); // { allowed: true, remainingSeconds: 241 }
 */
function getPermitJoin() {
  let remainingSeconds = null;
  if (this.z2mPermitJoin && this.z2mPermitJoinEnd !== null) {
    const remaining = Math.round((this.z2mPermitJoinEnd - Date.now()) / 1000);
    remainingSeconds = Math.min(PERMIT_JOIN_MAX_SECONDS, Math.max(0, remaining));
  }
  return { allowed: this.z2mPermitJoin, remainingSeconds };
}

module.exports = {
  getPermitJoin,
};

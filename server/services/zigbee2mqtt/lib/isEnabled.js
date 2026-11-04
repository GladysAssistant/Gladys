/**
 * @description Checks if z2m is ready to use: the broker runs and Zigbee2mqtt reported itself online.
 * @returns {boolean} Is the z2m environment ready to use?
 * @example
 * z2m.isEnabled();
 */
function isEnabled() {
  return this.mqttRunning && this.zigbee2mqttRunning;
}

module.exports = {
  isEnabled,
};

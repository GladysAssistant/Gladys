/**
 * @description Checks if z2m is ready to use: the broker runs and Zigbee2mqtt answered the health check.
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

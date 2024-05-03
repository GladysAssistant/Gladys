/**
 * @description Checks if z2m is ready to use.
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

/**
 * @description Get Zigbee2mqtt status.
 * @returns {object} Current Zigbee2mqtt containers and configuration status.
 * @example
 * status();
 */
function status() {
  const z2mEnabled = this.isEnabled();
  const zigbee2mqttStatus = {
    usbConfigured: this.usbConfigured,
    mqttExist: this.mqttExist,
    mqttRunning: this.mqttRunning,
    zigbee2mqttExist: this.zigbee2mqttExist,
    zigbee2mqttRunning: this.zigbee2mqttRunning,
    gladysConnected: this.gladysConnected,
    zigbee2mqttConnected: this.zigbee2mqttConnected,
    z2mEnabled,
    dockerBased: this.dockerBased,
    networkModeValid: this.networkModeValid,
  };
  return zigbee2mqttStatus;
}

module.exports = {
  status,
};

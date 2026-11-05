/**
 * @description Get Zigbee2mqtt status.
 * @returns {object} Current Zigbee2mqtt containers and configuration status.
 * @example
 * status();
 */
function status() {
  // The enable switch of the setup page: Gladys runs the Zigbee2mqtt container, or uses an external broker. Not
  // whether Zigbee2mqtt answers (see isEnabled), so that a failing Zigbee2mqtt can still be turned off.
  const z2mEnabled = this.zigbee2mqttExist || this.mqttClient !== null;
  const zigbee2mqttStatus = {
    usbConfigured: this.usbConfigured,
    networkAdapterConfigured: this.networkAdapterConfigured,
    mqttExist: this.mqttExist,
    mqttRunning: this.mqttRunning,
    zigbee2mqttExist: this.zigbee2mqttExist,
    zigbee2mqttRunning: this.zigbee2mqttRunning,
    gladysConnected: this.gladysConnected,
    zigbee2mqttConnected: this.zigbee2mqttConnected,
    zigbee2mqttStarting: this.zigbee2mqttStarting,
    z2mEnabled,
    dockerBased: this.dockerBased,
    networkModeValid: this.networkModeValid,
    coordinatorFirmware: this.coordinatorFirmware,
    z2mContainerError: this.z2mContainerError,
    mqttConnectionError: this.mqttConnectionError,
  };
  return zigbee2mqttStatus;
}

module.exports = {
  status,
};

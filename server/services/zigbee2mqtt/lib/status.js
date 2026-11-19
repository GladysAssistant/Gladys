/**
 * @description Get Zigbee2mqtt status.
 * @returns {object} Current Zigbee2mqtt containers and configuration status.
 * @example
 * status();
 */
function status() {
  // Gladys runs the Zigbee2mqtt container, or uses an external broker. Not whether Zigbee2mqtt answers (see
  // isEnabled): false once the service is stopped in the settings, which removes the containers (see disconnect).
  const z2mEnabled = this.zigbee2mqttExist || this.mqttClient !== null;
  const zigbee2mqttStatus = {
    configured: this.configured,
    stopped: this.stopped,
    stoppedAt: this.stoppedAt,
    updatePending: this.updatePending,
    usbConfigured: this.usbConfigured,
    dongleMissing: this.dongleMissing,
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
    z2mVersion: this.z2mVersion,
    deviceCount: this.deviceCount,
    z2mContainerError: this.z2mContainerError,
    ezspFallback: this.ezspFallback,
    mqttConnectionError: this.mqttConnectionError,
    installation: this.installation,
    prefetch: this.prefetch,
  };
  return zigbee2mqttStatus;
}

module.exports = {
  status,
};

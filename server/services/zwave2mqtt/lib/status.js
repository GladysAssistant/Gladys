/**
 * @description Get status of zwave2mqtt.
 * @returns {Object} TBD.
 * @example status(options);
 */
function status() {
  return {
    mqttExist: this.mqttService !== undefined,
    mqttConfigured: this.mqttService !== undefined ? this.mqttService.device.configured : false,
    mqttConnected: this.mqttService !== undefined ? this.mqttService.device.connected : false,
    zwave2mqttExist: true,
    zwave2mqttConfigured: true,
    zwave2mqttConnected: true,
    z2mEnabled: true,
    dockerBased: true,
    networkModeValid: true,
  };
}

module.exports = {
  status,
};

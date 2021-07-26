/**
 * @description Get status of zwave2mqtt.
 * @returns {Object} TBD.
 * @example status(options);
 */
function status() {
  return {
    mqttExist: true,
    mqttConfigured: true,
    mqttRunning: true,
    mqttConnected: true,
    zwave2mqttExist: true,
    zwave2mqttConfigured: true,
    zwave2mqttRunning: true,
    zwave2mqttConnected: true,
    z2mEnabled: true,
    dockerBased: true,
    networkModeValid: true
  };
}

module.exports = {
  status,
};

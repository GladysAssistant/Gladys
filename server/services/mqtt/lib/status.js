/**
 * @description Get MQTT status.
 * @returns {Object} Current MQTT network status.
 * @example
 * status();
 */
function status() {
  const mqttStatus = {
    configured: this.configured,
    connected: this.connected,
  };
  return mqttStatus;
}

module.exports = {
  status,
};

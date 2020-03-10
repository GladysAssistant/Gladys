/**
 * @description Get Zigbee2mqtt status.
 * @returns {Object} Current Zigbee2mqtt network status.
 * @example
 * status();
 */
function status() {
  const zigbee2mqttStatus = {
    configured: this.configured,
    connected: this.connected,
  };
  return zigbee2mqttStatus;
}

module.exports = {
  status,
};

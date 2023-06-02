/**
 * @description Get Node-red status.
 * @returns {object} Current Node-red containers and configuration status.
 * @example
 * status();
 */
function status() {
  const nodeRedEnabled = this.isEnabled();
  const zigbee2mqttStatus = {

    nodeRedExist: this.nodeRedExist,
    nodeRedRunning: this.nodeRedRunning,
    nodeRedEnabled,
    gladysConnected: this.gladysConnected,
    dockerBased: this.dockerBased,
    networkModeValid: this.networkModeValid,
  };
  return zigbee2mqttStatus;
}

module.exports = {
  status,
};

/**
 * @description Get Node-RED status.
 * @returns {object} Current Node-RED containers and configuration status.
 * @example
 * status();
 */
async function status() {
  const nodeRedEnabled = await this.isEnabled();
  const nodeRedStatus = {
    nodeRedExist: this.nodeRedExist,
    nodeRedRunning: this.nodeRedRunning,
    nodeRedEnabled,
    gladysConnected: this.gladysConnected,
    dockerBased: this.dockerBased,
    networkModeValid: this.networkModeValid,
  };
  return nodeRedStatus;
}

module.exports = {
  status,
};

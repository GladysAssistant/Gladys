/**
 * @description Get Node-red status.
 * @returns {object} Current Node-red containers and configuration status.
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
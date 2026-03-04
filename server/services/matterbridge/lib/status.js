/**
 * @description Get Matterbridge status.
 * @returns {object} Current Matterbridge containers and configuration status.
 * @example
 * status();
 */
async function status() {
  const matterbridgeEnabled = await this.isEnabled();
  const matterbridgeStatus = {
    matterbridgeExist: this.matterbridgeExist,
    matterbridgeRunning: this.matterbridgeRunning,
    matterbridgeEnabled,
    dockerBased: this.dockerBased,
    networkModeValid: this.networkModeValid,
  };
  return matterbridgeStatus;
}

module.exports = {
  status,
};

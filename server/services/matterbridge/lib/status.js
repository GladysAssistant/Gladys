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
    // Matterbridge cannot be turned on while the Matter bridge of Gladys is
    matterBridgeEnabled: await this.isMatterBridgeEnabled(),
    dockerBased: this.dockerBased,
    networkModeValid: this.networkModeValid,
  };
  return matterbridgeStatus;
}

module.exports = {
  status,
};

const { CONFIGURATION } = require('./constants');

/**
 * @description Checks if Matterbridge is ready to use.
 * @returns {boolean} Is the Matterbridge environment ready to use?
 * @example
 * await matterbridge.isEnabled();
 */
async function isEnabled() {
  const matterbridgeEnabled = await this.gladys.variable.getValue(CONFIGURATION.MATTERBRIDGE_ENABLED, this.serviceId);
  if (matterbridgeEnabled === '1') {
    return true;
  }
  return false;
}

module.exports = {
  isEnabled,
};

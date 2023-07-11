/**
 * @description Checks if Node-red is ready to use.
 * @returns {boolean} Is the Node-red environment ready to use?
 * @example
 * await nodeRed.isEnabled();
 */
async function isEnabled() {
  const nodeRedEnabled = await this.gladys.variable.getValue('NODERED_ENABLED', this.serviceId);
  if (nodeRedEnabled === '1') {
    return true;
  }
  return false;
}

module.exports = {
  isEnabled,
};

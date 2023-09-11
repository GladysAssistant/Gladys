/**
 * @description Checks if Node-RED is ready to use.
 * @returns {boolean} Is the Node-RED environment ready to use?
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

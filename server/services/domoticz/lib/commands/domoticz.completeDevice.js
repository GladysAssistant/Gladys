/**
 * @description Complete device with Gladys existing information.
 * @param {Object} device - Device to check.
 * @returns {Object} Returns completed device.
 * @example
 * const device = domoticzManager.completeDevice({});
 */
function completeDevice(device) {
  const existing = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
  if (!existing) {
    return device;
  }

  return { ...existing, ...device };
}

module.exports = {
  completeDevice,
};

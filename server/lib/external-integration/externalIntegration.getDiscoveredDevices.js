/**
 * @description Get the in-memory list of discovered devices of an
 * integration, with the "created" flag (a device with this external_id has
 * already been created by the user).
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<Array>} Resolve with the list of discovered devices.
 * @example
 * const devices = await gladys.externalIntegration.getDiscoveredDevices('ext-dev-my-integration');
 */
async function getDiscoveredDevices(selector) {
  const service = await this.getBySelector(selector);
  const devices = this.discoveredDevices.get(service.id) || [];
  return devices.map((device) => ({
    ...device,
    created: this.stateManager.get('deviceByExternalId', device.external_id) !== null,
  }));
}

module.exports = {
  getDiscoveredDevices,
};

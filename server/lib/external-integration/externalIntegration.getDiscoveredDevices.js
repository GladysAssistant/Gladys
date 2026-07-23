// the published STRUCTURE differs from the created device when features
// were added, removed or redefined — the Discovery screen then offers an
// explicit "Update" gesture (params alone are upserted automatically)
const featureSignature = (feature) =>
  JSON.stringify([
    feature.external_id,
    feature.category,
    feature.type,
    feature.unit || null,
    feature.min !== undefined ? feature.min : null,
    feature.max !== undefined ? feature.max : null,
  ]);

/**
 * @description Compare the features published in the discovery with the
 * ones of the created device.
 * @param {Array} publishedFeatures - Features published by the integration.
 * @param {Array} createdFeatures - Features of the created device.
 * @returns {boolean} True when the published structure differs.
 * @example
 * const changed = structureDiffers(published.features, created.features);
 */
function structureDiffers(publishedFeatures, createdFeatures) {
  const publishedSignatures = publishedFeatures.map(featureSignature).sort();
  const createdSignatures = (createdFeatures || []).map(featureSignature).sort();
  return JSON.stringify(publishedSignatures) !== JSON.stringify(createdSignatures);
}

/**
 * @description Get the in-memory list of discovered devices of an
 * integration, with the "created" flag (a device with this external_id has
 * already been created by the user) and the "structure_changed" flag (the
 * re-published features differ from the created device: the Discovery
 * screen offers an Update button).
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<Array>} Resolve with the list of discovered devices.
 * @example
 * const devices = await gladys.externalIntegration.getDiscoveredDevices('ext-dev-my-integration');
 */
async function getDiscoveredDevices(selector) {
  const service = await this.getBySelector(selector);
  const devices = this.discoveredDevices.get(service.id) || [];
  return devices.map((device) => {
    const createdDevice = this.stateManager.get('deviceByExternalId', device.external_id);
    return {
      ...device,
      created: createdDevice !== null,
      structure_changed: createdDevice !== null && structureDiffers(device.features, createdDevice.features),
    };
  });
}

module.exports = {
  getDiscoveredDevices,
};

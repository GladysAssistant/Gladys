/**
 * @description Get root electric meter device.
 * @param {object} deviceFeature - The device feature.
 * @returns {Promise<object>} The root electric meter device.
 * @example
 * await getRootElectricMeterDevice();
 */
function getRootElectricMeterDevice(deviceFeature) {
  const newParentId = deviceFeature.energy_parent_id;
  if (newParentId) {
    let cursor = this.stateManager.get('deviceFeatureById', newParentId);
    // If parent doesn't exist, allow null-like behavior? We'll let DB constraint fail if invalid
    while (cursor) {
      if (!cursor.energy_parent_id) {
        break;
      }
      // move to next ancestor
      cursor = this.stateManager.get('deviceFeatureById', cursor.energy_parent_id);
    }
    return cursor;
  }
  return null;
}

module.exports = {
  getRootElectricMeterDevice,
};

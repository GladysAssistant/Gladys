/**
 * @description Called after a thermostat device is deleted. Its features, its
 * params and its schedule link all go with the row — the features and params by
 * the device's own cascade, the link by the foreign key — so there is no state
 * left to clean up here. Only the caches derived from the device list have to be
 * dropped, or the next pass would still regulate a thermostat that no longer
 * exists. The open dashboards are told to reload: a widget still pointing to
 * the deleted thermostat then says so at once, instead of on the next page load.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.postDelete(device);
 */
async function postDelete() {
  this.invalidateDeviceCaches();
  this.broadcastConfigUpdated();
}

module.exports = { postDelete };

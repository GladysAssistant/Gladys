const Promise = require('bluebird');
const logger = require('../../utils/logger');

/**
 * @description Delete a device which has too many states to be deleted at once: its states
 * are purged feature after feature (one background job each, visible on the jobs page), then
 * the device is deleted. Called by `destroy` without being awaited, so it never rejects.
 * @param {object} device - The device to delete, with its features.
 * @returns {Promise} Resolve when the device is deleted, or when its deletion failed.
 * @example
 * device.destroyAfterStatesPurge(device);
 */
async function destroyAfterStatesPurge(device) {
  // A second "Delete" while the purge is running must not start a second purge
  if (this.devicesBeingDestroyed.has(device.selector)) {
    return;
  }
  this.devicesBeingDestroyed.add(device.selector);
  try {
    // One feature after the other: every purge holds the DuckDB write connection
    await Promise.each(device.features, (deviceFeature) => this.purgeStatesByFeatureId(deviceFeature.id));
    // The device was alive during the purge: the few states it saved meanwhile are deleted
    // with it, whatever their number
    await this.destroy(device.selector, { skipStatesGuard: true });
    logger.info(`Device ${device.selector} deleted after the purge of its states`);
  } catch (e) {
    logger.error(`Unable to delete device ${device.selector} after the purge of its states`, e);
  } finally {
    this.devicesBeingDestroyed.delete(device.selector);
  }
}

module.exports = {
  destroyAfterStatesPurge,
};

const logger = require('../../utils/logger');

/**
 * @description Delete in the background a device which has too many states to be deleted at
 * once: its states are purged, then the device is deleted, in one job visible on the jobs
 * page (see device.purgeStatesThenDestroy.js). Called by `destroy` without being awaited, so
 * it never rejects.
 * @param {object} device - The device to delete.
 * @param {number} statesCount - The number of states the device had when its deletion was asked.
 * @returns {Promise} Resolve when the device is deleted, or when its deletion failed.
 * @example
 * device.destroyAfterStatesPurge(device, 12000);
 */
async function destroyAfterStatesPurge(device, statesCount) {
  // The deletion is bound to the device the user asked to delete: its id, and the
  // external_id it had then. A device re-paired in place keeps its id but not its
  // external_id, and must not be deleted hours later.
  const deletion = {
    id: device.id,
    selector: device.selector,
    external_id: device.external_id,
    name: device.name,
    statesCount,
  };
  this.devicesBeingDestroyed.set(device.id, deletion);
  try {
    await this.purgeStatesThenDestroy(deletion);
  } catch (e) {
    // the job of the deletion is marked as failed, with this error
    logger.error(`Unable to delete device ${device.selector} after the purge of its states`, e);
  } finally {
    this.devicesBeingDestroyed.delete(device.id);
  }
}

module.exports = {
  destroyAfterStatesPurge,
};

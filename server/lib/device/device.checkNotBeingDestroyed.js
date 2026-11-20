const { ConflictError } = require('../../utils/coreErrors');

/**
 * @description Refuse to save a device which is being deleted in the background, or which was:
 * its card stays on the screen until the page is reloaded, and saving it would change the
 * device under the purge, or create it again, without its history, once deleted.
 * @param {object} device - The device a user is saving.
 * @example
 * device.checkNotBeingDestroyed({ id: 'c0f20b0c-1eca-4b6e-9a9b-1e2f6e2b0b1a', external_id: 'mqtt:plug' });
 */
function checkNotBeingDestroyed(device) {
  if (this.devicesBeingDestroyed.has(device.id) || this.devicesDestroyedInBackground.has(device.id)) {
    throw new ConflictError(`Device ${device.id} is being deleted`);
  }
  // without its id (or with an id that is not in the database), `create` finds the device by its
  // external_id: the device under the purge would be changed all the same
  const deletion = [...this.devicesBeingDestroyed.values()].find(
    (deviceBeingDestroyed) => deviceBeingDestroyed.external_id === device.external_id,
  );
  if (deletion) {
    throw new ConflictError(`Device ${deletion.id} is being deleted`);
  }
}

module.exports = {
  checkNotBeingDestroyed,
};

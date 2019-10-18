const { NotFoundError } = require('../../utils/coreErrors');
const { DEVICE_POLL_FREQUENCIES } = require('../../utils/constants');
const db = require('../../models');

/**
 * @description Destroy a device.
 * @param {string} selector - Device selector.
 * @example
 * device.destroy('test-device');
 */
async function destroy(selector) {
  const device = await db.Device.findOne({
    include: [
      {
        model: db.DeviceFeature,
        as: 'features',
      },
    ],
    where: {
      selector,
    },
  });

  if (device === null) {
    throw new NotFoundError('Device not found');
  }

  await device.destroy();

  // removing from ram cache
  this.stateManager.deleteState('device', device.selector, device);
  this.stateManager.deleteState('deviceByExternalId', device.external_id, device);
  this.stateManager.deleteState('deviceById', device.id, device);
  device.features.forEach((feature) => {
    this.stateManager.deleteState('deviceFeature', feature.selector, feature);
    this.stateManager.deleteState('deviceFeatureByExternalId', feature.external_id, feature);
  });

  // remove from poll devices
  // foreach frequency
  Object.keys(DEVICE_POLL_FREQUENCIES).forEach((frequency) => {
    // if the frequency exist
    if (this.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES[frequency]]) {
      // we see if the device is member of the group without being member
      const index = this.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES[frequency]].findIndex(
        (d) => d.selector === device.selector,
      );
      // if yes, we remove it
      if (index !== -1) {
        this.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES[frequency]].splice(index, 1);
      }
    }
  });
  return null;
}

module.exports = {
  destroy,
};

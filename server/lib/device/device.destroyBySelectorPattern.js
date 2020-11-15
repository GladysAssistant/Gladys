const { Op } = require('sequelize');
const db = require('../../models');
const { DEVICE_POLL_FREQUENCIES } = require('../../utils/constants');

/**
 * @description Destroy a device by selectr pattern.
 * @param {string} selector - Device selector patter.
 * @example
 * device.destroyBySelectorPattern('test');
 */
async function destroyBySelectorPattern(selector) {
  const devices = await db.Device.findAll({
    include: [
      {
        model: db.DeviceParam,
        as: 'params',
      },
      {
        model: db.DeviceFeature,
        as: 'features',
      },
    ],
    where: {
      selector: { [Op.like]: `${selector}%` },
    },
  });

  devices.map(async (device) => {
    device.destroy();
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
  });

  return null;
}

module.exports = {
  destroyBySelectorPattern,
};

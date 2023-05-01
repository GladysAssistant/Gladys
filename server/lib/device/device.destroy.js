const { QueryTypes } = require('sequelize');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { DEVICE_POLL_FREQUENCIES, EVENTS } = require('../../utils/constants');
const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Destroy a device.
 * @param {string} selector - Device selector.
 * @returns {Promise} Resolve when device is destroyed.
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

  // Deleting a device cascade delete its device features and device feature states
  // This is a blocking operation that takes a lot of time
  // So if the device has too much states, we don't allow the user to delete the device
  // and ask him to come back later
  const deviceStatesCount = await db.sequelize.query(
    `
      SELECT COUNT(s.id) as count
      FROM t_device d
      LEFT JOIN t_device_feature df ON d.id = df.device_id
      LEFT JOIN t_device_feature_state s ON df.id = s.device_feature_id
      WHERE d.id = :id
      GROUP BY d.id

      UNION ALL 

      SELECT COUNT(s.id) as count
      FROM t_device d
      LEFT JOIN t_device_feature df ON d.id = df.device_id
      LEFT JOIN t_device_feature_state_aggregate s ON df.id = s.device_feature_id
      WHERE d.id = :id
      GROUP BY d.id
    `,
    {
      replacements: {
        id: device.id,
      },
      type: QueryTypes.SELECT,
    },
  );

  const totalNumberOfStates = deviceStatesCount[0].count + deviceStatesCount[1].count;
  logger.info(`Deleting device ${selector}, device has ${totalNumberOfStates} states in DB`);
  if (totalNumberOfStates > this.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE) {
    logger.info(`Deleting device ${selector}, device has too much states. Cleaning states first.`);
    device.features.forEach((deviceFeature) => {
      this.eventManager.emit(EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE, deviceFeature.id);
    });
    throw new BadParameters(`${totalNumberOfStates} states in DB. Too much states!`);
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

  // notify device removal
  this.notify(device, EVENTS.DEVICE.DELETE);

  return null;
}

module.exports = {
  destroy,
};

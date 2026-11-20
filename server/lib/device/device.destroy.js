const { QueryTypes } = require('sequelize');
const Promise = require('bluebird');
const { NotFoundError, BadParameters, ConflictError } = require('../../utils/coreErrors');
const { DEVICE_POLL_FREQUENCIES, EVENTS } = require('../../utils/constants');
const db = require('../../models');
const logger = require('../../utils/logger');

const TOO_MUCH_STATES_MESSAGE = 'Too much states!';

/**
 * @description Tell if an error is the answer of `destroy` to a device which has too many
 * states to be deleted at once.
 * @param {Error} error - The error thrown by `destroy`.
 * @returns {boolean} True when the device was not deleted because of its number of states.
 * @example
 * isTooMuchStatesError(new BadParameters('12000 states in DB. Too much states!'));
 */
function isTooMuchStatesError(error) {
  return error instanceof BadParameters && error.message.endsWith(TOO_MUCH_STATES_MESSAGE);
}

/**
 * @description Destroy a device.
 * @param {string} selector - Device selector.
 * @param {object} [options] - Options of the deletion.
 * @param {object} [options.scheduledDeletion] - Only for the background deletion of a device
 * (device.purgeStatesThenDestroy.js): the device it was asked to delete, `{ id, external_id }`.
 * Another device found under this selector is not deleted.
 * @returns {Promise} Resolve when device is destroyed.
 * @example
 * device.destroy('test-device');
 */
async function destroy(selector, options = {}) {
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

  const { scheduledDeletion } = options;
  if (scheduledDeletion) {
    if (device.id !== scheduledDeletion.id || device.external_id !== scheduledDeletion.external_id) {
      throw new NotFoundError('Device not found');
    }
  } else if (this.devicesBeingDestroyed.has(device.id)) {
    // The device is already being deleted in the background: a second "Delete" gets the same
    // answer as the first one, without counting the states again nor deleting the device
    // under the purge.
    const { statesCount } = this.devicesBeingDestroyed.get(device.id);
    throw new BadParameters(`${statesCount} states in DB. ${TOO_MUCH_STATES_MESSAGE}`);
  }

  // Deleting a device cascade delete its device features and device feature states
  // This is a blocking operation that takes a lot of time
  // So if the device has too much states, it is not deleted right away: its states are
  // purged in the background first, then the device is deleted, without the user having
  // to come back (see device.destroyAfterStatesPurge.js).
  // States live in DuckDB since the migration; the SQLite tables below only hold
  // leftovers of installations that have not run the migration yet.
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

  let duckDbStatesCount = 0;
  if (device.features.length > 0) {
    const placeholders = device.features.map(() => '?').join(',');
    const [{ count }] = await db.duckDbReadConnectionAllAsync(
      `SELECT COUNT(*) AS count FROM t_device_feature_state WHERE device_feature_id IN (${placeholders})`,
      ...device.features.map((feature) => feature.id),
    );
    duckDbStatesCount = Number(count);
  }

  const totalNumberOfStates = deviceStatesCount[0].count + deviceStatesCount[1].count + duckDbStatesCount;
  logger.info(`Deleting device ${selector}, device has ${totalNumberOfStates} states in DB`);
  if (totalNumberOfStates > this.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE) {
    logger.info(`Deleting device ${selector}, device has too much states. Cleaning states first.`);
    if (!scheduledDeletion) {
      // A migration of this device (as its source or its destination) is moving its history:
      // purging it now would lose states on the way. Same answer as a second migration.
      if (this.migrationsInProgress.has(device.selector)) {
        throw new ConflictError(`A migration is already in progress for device ${device.selector}`);
      }
      // Not awaited: the purge can take minutes, and the caller is told right away that the
      // deletion goes on in the background. This function never rejects.
      this.destroyAfterStatesPurge(device, totalNumberOfStates);
    }
    throw new BadParameters(`${totalNumberOfStates} states in DB. ${TOO_MUCH_STATES_MESSAGE}`);
  }

  // Delete states from DuckDB
  await Promise.each(device.features, async (feature) => {
    await db.duckDbWriteConnectionAllAsync(
      'DELETE FROM t_device_feature_state WHERE device_feature_id = ?',
      feature.id,
    );
  });

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
  isTooMuchStatesError,
};

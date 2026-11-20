const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');
const { isTooMuchStatesError } = require('./device.destroy');

const STEPS = {
  PURGING_STATES: 'purging_states',
  DELETING_DEVICE: 'deleting_device',
};

/**
 * @description The job of a background deletion: purge the states of the device, feature after
 * feature, then delete the device. Before each purge and before the deletion, the device is
 * read again: when it is gone, or was taken over by another appliance (same row, another
 * external_id), nothing more is purged and nothing is deleted.
 * @param {object} deletion - The deletion to run, see device.destroyAfterStatesPurge.js.
 * @param {string} jobId - Id of the job.
 * @returns {Promise} Resolve when the device is deleted or was left alone, reject when it could not be deleted.
 * @example
 * device.purgeStatesThenDestroy({ id, selector, external_id, name, statesCount });
 */
async function purgeStatesThenDestroy(deletion, jobId) {
  await this.job.updateProgress(jobId, 0, { device_name: deletion.name, step: STEPS.PURGING_STATES });

  // The device the user asked to delete, as it is now. Null when there is nothing to delete
  // anymore.
  const getDeviceToDestroy = async () => {
    const device = await db.Device.findOne({
      include: [{ model: db.DeviceFeature, as: 'features' }],
      where: { id: deletion.id },
    });
    if (device === null) {
      logger.info(`Device ${deletion.selector} was deleted during the purge of its states`);
      return null;
    }
    if (device.external_id !== deletion.external_id) {
      logger.info(`Device ${deletion.selector} was replaced during the purge of its states: it is kept`);
      await this.job.updateProgress(jobId, 100, { device_kept: true });
      return null;
    }
    return device;
  };

  // The device is alive during the purge, and goes on saving states. When it saved too many of
  // them for the deletion to go through, they are purged the same way — sliced, never in one
  // statement — and the deletion is tried again, a limited number of times.
  const purgeAndDestroy = async (round) => {
    const device = await getDeviceToDestroy();
    if (device === null) {
      return null;
    }
    let numberOfFailedPurges = 0;
    let deviceGoneOrReplaced = false;
    // One feature after the other: every purge holds the DuckDB write connection. A purge
    // that fails does not stop the following ones, it only cancels the deletion.
    await Promise.each(device.features, async (deviceFeature, index) => {
      deviceGoneOrReplaced = deviceGoneOrReplaced || (await getDeviceToDestroy()) === null;
      if (deviceGoneOrReplaced) {
        return;
      }
      try {
        await this.purgeStatesByFeatureId(deviceFeature.id);
      } catch (e) {
        numberOfFailedPurges += 1;
        logger.warn(`Unable to purge the states of feature ${deviceFeature.selector}`, e);
      }
      // the last percents are for the deletion of the device itself
      await this.job.updateProgress(jobId, Math.round(((index + 1) * 95) / device.features.length));
    });
    if (deviceGoneOrReplaced) {
      return null;
    }
    if (numberOfFailedPurges > 0) {
      throw new Error(`The states of ${numberOfFailedPurges} feature(s) could not be purged, the device is kept`);
    }
    const deviceToDestroy = await getDeviceToDestroy();
    if (deviceToDestroy === null) {
      return null;
    }
    await this.job.updateProgress(jobId, 95, { step: STEPS.DELETING_DEVICE });
    try {
      await this.destroy(deviceToDestroy.selector, { scheduledDeletion: deletion });
    } catch (e) {
      if (!isTooMuchStatesError(e) || round >= this.MAX_STATES_PURGES_TO_DELETE_DEVICE) {
        throw e;
      }
      logger.info(`Device ${deletion.selector} saved too many states during the purge, purging again`);
      await this.job.updateProgress(jobId, 0, { step: STEPS.PURGING_STATES });
      return purgeAndDestroy(round + 1);
    }
    // the card of the device may still be on a screen: saving it must not create it again
    this.devicesDestroyedInBackground.add(deletion.id);
    await this.job.updateProgress(jobId, 100);
    logger.info(`Device ${deletion.selector} deleted after the purge of its states`);
    return null;
  };

  return purgeAndDestroy(1);
}

module.exports = {
  purgeStatesThenDestroy,
};

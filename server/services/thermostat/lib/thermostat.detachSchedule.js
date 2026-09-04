const logger = require('../../../utils/logger');

const ACTIVE_SCHEDULE_PARAM = 'THERMOSTAT_ACTIVE_SCHEDULE';

/**
 * @description Drop the THERMOSTAT_ACTIVE_SCHEDULE param of every thermostat
 * that follows the given schedule. Called before a schedule is deleted: the
 * regulation degrades gracefully on a missing schedule (it falls back on the
 * stored preset), but the device would keep pointing at a row that no longer
 * exists, which the edit page cannot resolve and which would be silently
 * re-adopted by a new schedule reusing the selector.
 * @param {string} scheduleSelector - Selector of the schedule being removed.
 * @returns {Promise<number>} How many thermostats were detached.
 * @example
 * await thermostatHandler.detachSchedule('my-schedule');
 */
async function detachSchedule(scheduleSelector) {
  const devices = await this.gladys.device.get({ service: 'thermostat' });
  const following = (devices || []).filter((device) =>
    (device.params || []).some((param) => param.name === ACTIVE_SCHEDULE_PARAM && param.value === scheduleSelector),
  );

  await Promise.all(
    following.map(async (device) => {
      try {
        await this.gladys.device.destroyParam(device, ACTIVE_SCHEDULE_PARAM);
        logger.info(`Thermostat: detached "${device.selector}" from deleted schedule "${scheduleSelector}"`);
      } catch (e) {
        logger.warn(`Thermostat: could not detach "${device.selector}" from "${scheduleSelector}": ${e.message}`);
      }
    }),
  );

  if (following.length > 0) {
    this.broadcastConfigUpdated();
  }
  return following.length;
}

module.exports = { detachSchedule, ACTIVE_SCHEDULE_PARAM };

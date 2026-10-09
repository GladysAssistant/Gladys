const db = require('../../../models');
const logger = require('../../../utils/logger');
const { getCurrentPoint } = require('./thermostat.getSchedules');
const { releaseFromProgramme } = require('./thermostat.scheduleDevice');

/**
 * @description Delete a thermostat schedule.
 * Its transition points and the links to the thermostats that follow it go with
 * it through the foreign keys' ON DELETE CASCADE, so a single destroy is enough:
 * there is no detach step, and no thermostat is left pointing at a deleted row.
 * The thermostats that followed it are then left on the point that was in force,
 * as a detach leaves them (see releaseFromProgramme).
 * @param {string} selector - Schedule selector.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.deleteSchedule('week');
 */
async function deleteSchedule(selector) {
  logger.info(`Thermostat: Deleting schedule "${selector}"`);
  const schedule = await db.ThermostatSchedule.findOne({ where: { selector } });
  if (!schedule) {
    throw new Error(`Schedule not found: ${selector}`);
  }

  const current = await getCurrentPoint(schedule.id);
  const followers = await db.ThermostatScheduleDevice.findAll({ where: { schedule_id: schedule.id }, raw: true });
  await schedule.destroy();
  // The schedule is gone whatever happens next. A follower that could not be
  // left on its point is logged: failing the request answered an error for a
  // deletion that had happened, and skipped telling the widgets.
  await Promise.all(
    followers.map(async (link) => {
      try {
        await releaseFromProgramme.call(this, link.device_id, current);
      } catch (e) {
        logger.warn(
          `Thermostat: could not leave ${link.device_id} on the point of schedule "${selector}": ${e.message}`,
        );
      }
    }),
  );
  if (followers.length > 0) {
    this.broadcastConfigUpdated();
  }
}

module.exports = { deleteSchedule };

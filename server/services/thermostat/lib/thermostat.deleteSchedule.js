const db = require('../../../models');
const logger = require('../../../utils/logger');

/**
 * @description Delete a thermostat schedule and all its slots.
 * @param {string} selector - Schedule selector.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.deleteSchedule('my-schedule');
 */
async function deleteSchedule(selector) {
  logger.info(`Thermostat: Deleting schedule "${selector}"`);
  const schedule = await db.ThermostatSchedule.findOne({ where: { selector } });
  if (!schedule) {
    throw new Error(`Schedule not found: ${selector}`);
  }
  await db.ThermostatScheduleSlot.destroy({ where: { schedule_id: schedule.id } });
  await schedule.destroy();
}

module.exports = { deleteSchedule };

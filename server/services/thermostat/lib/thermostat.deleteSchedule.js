const db = require('../../../models');
const logger = require('../../../utils/logger');

/**
 * @description Delete a thermostat schedule and all its slots.
 * The slots go with the schedule through the foreign key's ON DELETE CASCADE,
 * so a single destroy is enough and there is nothing to keep in a transaction.
 * The thermostats that follow this schedule are detached first: leaving
 * THERMOSTAT_ACTIVE_SCHEDULE pointing at a deleted row degrades gracefully
 * (regulation falls back on the preset) but the device would keep an orphan
 * reference that the edit page cannot resolve.
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

  await this.detachSchedule(selector);
  await schedule.destroy();
}

module.exports = { deleteSchedule };

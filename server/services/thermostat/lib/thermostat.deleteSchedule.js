const db = require('../../../models');
const logger = require('../../../utils/logger');

/**
 * @description Delete a thermostat schedule.
 * Its transition points and the links to the thermostats that follow it go with
 * it through the foreign keys' ON DELETE CASCADE, so a single destroy is enough:
 * there is no detach step, and no thermostat is left pointing at a deleted row.
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

  await schedule.destroy();
}

module.exports = { deleteSchedule };

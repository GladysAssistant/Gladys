const db = require('../../../models');
const logger = require('../../../utils/logger');
const { validateSchedule } = require('../../../utils/thermostatValidateSchedule');
const { getScheduleBySelector } = require('./thermostat.getSchedules');

/**
 * @description Create a thermostat schedule in a house, with its transition points.
 * @param {string} houseSelector - Selector of the house the schedule belongs to.
 * @param {object} scheduleData - Schedule data: { name, transitions }.
 * @returns {Promise<object>} Created schedule.
 * @example
 * await thermostatHandler.createSchedule('main-house', { name: 'Holidays', transitions: [] });
 */
async function createSchedule(houseSelector, scheduleData) {
  logger.info(`Thermostat: Creating schedule "${scheduleData && scheduleData.name}"`);

  // Use the validated payload, not the raw one: Joi coerces day_of_week to a
  // number and defaults transitions to [], and persisting the raw values would
  // store a string day that then matches no regulation tick.
  const validated = validateSchedule(scheduleData);

  const house = await db.House.findOne({ where: { selector: houseSelector } });
  if (!house) {
    throw new Error(`House not found: ${houseSelector}`);
  }

  // A schedule name is unique within its house, not across the installation:
  // two houses may each have a "Week".
  const existing = await db.ThermostatSchedule.findOne({
    where: { house_id: house.id, name: validated.name },
  });
  if (existing) {
    throw new Error(`A schedule with the name "${validated.name}" already exists`);
  }

  let created;
  try {
    created = await db.ThermostatSchedule.create(
      {
        house_id: house.id,
        name: validated.name,
        transitions: validated.transitions.map(({ day_of_week: dayOfWeek, time, preset }) => ({
          day_of_week: dayOfWeek,
          time,
          preset,
        })),
      },
      { include: [{ model: db.ThermostatScheduleTransition, as: 'transitions' }] },
    );
  } catch (e) {
    // The precheck above is not atomic: two concurrent creates can both find no
    // duplicate and reach this insert. Report the race the same way, so the
    // caller sees one message whichever check caught it.
    if (e.name === 'SequelizeUniqueConstraintError') {
      throw new Error(`A schedule with the name "${validated.name}" already exists`);
    }
    throw e;
  }

  return getScheduleBySelector(created.selector);
}

module.exports = { createSchedule };

const db = require('../../../models');
const { slugify } = require('../../../utils/slugify');
const logger = require('../../../utils/logger');
const { validateSchedule } = require('../../../utils/thermostatValidateSchedule');

/**
 * @description Create a thermostat schedule with its slots.
 * @param {object} scheduleData - Schedule data: { name, slots }.
 * @returns {Promise<object>} Created schedule.
 * @example
 * await thermostatHandler.createSchedule({ name: 'Vacances', slots: [] });
 */
async function createSchedule(scheduleData) {
  logger.info(`Thermostat: Creating schedule "${scheduleData.name}"`);

  // Use the validated payload, not the raw one: Joi coerces day_of_week to a
  // number and defaults slots to [], and persisting the raw values would store
  // a string day that then matches no regulation tick.
  const validated = validateSchedule(scheduleData);

  const existing = await db.ThermostatSchedule.findOne({ where: { name: validated.name } });
  if (existing) {
    throw new Error(`A schedule with the name "${validated.name}" already exists`);
  }

  const selector = slugify(`${validated.name}-${Date.now()}`, true);

  let created;
  try {
    created = await db.ThermostatSchedule.create(
      {
        name: validated.name,
        selector,
        slots: validated.slots.map((slot) => ({
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          preset: slot.preset,
        })),
      },
      { include: [{ model: db.ThermostatScheduleSlot, as: 'slots' }] },
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

  const result = await db.ThermostatSchedule.findByPk(created.id, {
    include: [{ model: db.ThermostatScheduleSlot, as: 'slots' }],
  });
  return result.get({ plain: true });
}

module.exports = { createSchedule };

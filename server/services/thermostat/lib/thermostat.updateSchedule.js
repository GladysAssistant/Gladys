const db = require('../../../models');
const logger = require('../../../utils/logger');
const { validateSchedule } = require('../../../utils/thermostatValidateSchedule');

/**
 * @description Update a thermostat schedule (name + full replace of slots).
 * @param {string} selector - Schedule selector.
 * @param {object} scheduleData - Updated data: { name, slots }.
 * @returns {Promise<object>} Updated schedule with slots.
 * @example
 * await thermostatHandler.updateSchedule('my-schedule', { name: 'New name', slots: [] });
 */
async function updateSchedule(selector, scheduleData) {
  logger.info(`Thermostat: Updating schedule "${selector}"`);

  // Use the validated payload: Joi coerces day_of_week and defaults slots to [].
  const validated = validateSchedule(scheduleData);

  const schedule = await db.ThermostatSchedule.findOne({ where: { selector } });
  if (!schedule) {
    throw new Error(`Schedule not found: ${selector}`);
  }

  const duplicate = await db.ThermostatSchedule.findOne({
    where: { name: validated.name },
  });
  if (duplicate && duplicate.id !== schedule.id) {
    throw new Error(`A schedule with the name "${validated.name}" already exists`);
  }

  // Replace name + slots atomically: a failure mid-way must not lose the existing slots
  await db.sequelize.transaction(async (transaction) => {
    await schedule.update({ name: validated.name }, { transaction });

    await db.ThermostatScheduleSlot.destroy({ where: { schedule_id: schedule.id }, transaction });

    if (validated.slots.length > 0) {
      await db.ThermostatScheduleSlot.bulkCreate(
        validated.slots.map((slot) => ({
          schedule_id: schedule.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          preset: slot.preset,
        })),
        { transaction },
      );
    }
  });

  const result = await db.ThermostatSchedule.findByPk(schedule.id, {
    include: [{ model: db.ThermostatScheduleSlot, as: 'slots' }],
    order: [
      [{ model: db.ThermostatScheduleSlot, as: 'slots' }, 'day_of_week', 'ASC'],
      [{ model: db.ThermostatScheduleSlot, as: 'slots' }, 'start_time', 'ASC'],
    ],
  });
  return result.get({ plain: true });
}

module.exports = { updateSchedule };

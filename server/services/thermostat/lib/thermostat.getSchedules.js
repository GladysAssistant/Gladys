const db = require('../../../models');

/**
 * @description Get all thermostat schedules.
 * @returns {Promise<Array>} List of schedules with their slots.
 * @example
 * await gladys.services.thermostat.device.getSchedules();
 */
async function getSchedules() {
  const schedules = await db.ThermostatSchedule.findAll({
    include: [{ model: db.ThermostatScheduleSlot, as: 'slots' }],
    order: [
      ['name', 'ASC'],
      [{ model: db.ThermostatScheduleSlot, as: 'slots' }, 'day_of_week', 'ASC'],
      [{ model: db.ThermostatScheduleSlot, as: 'slots' }, 'start_time', 'ASC'],
    ],
  });
  return schedules.map((s) => s.get({ plain: true }));
}

module.exports = { getSchedules };

const db = require('../../../models');

const TRANSITION_ORDER = [
  [{ model: db.ThermostatScheduleTransition, as: 'transitions' }, 'day_of_week', 'ASC'],
  [{ model: db.ThermostatScheduleTransition, as: 'transitions' }, 'time', 'ASC'],
];

const SCHEDULE_INCLUDE = [
  { model: db.ThermostatScheduleTransition, as: 'transitions' },
  { model: db.House, as: 'house', attributes: ['selector'] },
  {
    model: db.ThermostatScheduleDevice,
    as: 'thermostats',
    include: [
      {
        model: db.Device,
        as: 'device',
        attributes: ['selector', 'name'],
        include: [{ model: db.Room, as: 'room', attributes: ['selector'] }],
      },
    ],
  },
];

/**
 * @description Shape a schedule row as the API object: the house and the
 * thermostats are named by selector, like everywhere else in the API, rather
 * than exposing the join rows and the internal ids.
 * @param {object} schedule - Schedule row, with its transitions, house and thermostats loaded.
 * @returns {object} The schedule as the API returns it.
 * @example
 * formatSchedule(await db.ThermostatSchedule.findByPk(id, { include: SCHEDULE_INCLUDE }));
 */
function formatSchedule(schedule) {
  const plain = schedule.get({ plain: true });
  return {
    id: plain.id,
    selector: plain.selector,
    name: plain.name,
    // house_id is NOT NULL with a cascade, and the include is always present, so
    // the house is always there — unlike the room, which a device may not have.
    house: plain.house.selector,
    transitions: plain.transitions.map(({ day_of_week: dayOfWeek, time, preset }) => ({
      day_of_week: dayOfWeek,
      time,
      preset,
    })),
    devices: plain.thermostats.map((link) => ({
      selector: link.device.selector,
      name: link.device.name,
      room: link.device.room ? link.device.room.selector : null,
    })),
  };
}

/**
 * @description Get the thermostat schedules, optionally restricted to one house.
 * @param {string} [houseSelector] - House selector to filter on.
 * @returns {Promise<Array>} List of schedules with their transitions and thermostats.
 * @example
 * await gladys.services.thermostat.device.getSchedules('main-house');
 */
async function getSchedules(houseSelector) {
  const include = [...SCHEDULE_INCLUDE];
  if (houseSelector) {
    // An inner join on the house selector, so an unknown house returns nothing
    // rather than every schedule.
    include[1] = { ...include[1], where: { selector: houseSelector }, required: true };
  }

  const schedules = await db.ThermostatSchedule.findAll({
    include,
    order: [['name', 'ASC'], ...TRANSITION_ORDER],
  });
  return schedules.map(formatSchedule);
}

/**
 * @description Get one thermostat schedule by its selector.
 * @param {string} selector - Schedule selector.
 * @returns {Promise<object>} The schedule.
 * @example
 * await gladys.services.thermostat.device.getScheduleBySelector('week');
 */
async function getScheduleBySelector(selector) {
  const schedule = await db.ThermostatSchedule.findOne({
    where: { selector },
    include: SCHEDULE_INCLUDE,
    order: TRANSITION_ORDER,
  });
  if (!schedule) {
    throw new Error(`Schedule not found: ${selector}`);
  }
  return formatSchedule(schedule);
}

module.exports = { getSchedules, getScheduleBySelector, formatSchedule, SCHEDULE_INCLUDE, TRANSITION_ORDER };

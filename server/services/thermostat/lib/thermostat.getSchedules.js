const db = require('../../../models');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const {
  findCurrentTransition,
  findNextTransition,
  getCurrentDayAndMinutes,
} = require('../../../utils/thermostatSchedule');

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
 * `current` and `next` are computed here rather than by the client: they are
 * wall-clock times in the house, so resolving them in the browser would show a
 * phone abroad a different point than the one actually heating the house. The
 * widget renders "Eco until 08:30" straight from `next`.
 * @param {object} schedule - Schedule row, with its transitions, house and thermostats loaded.
 * @param {string} [timezone] - The Gladys timezone the points are resolved in.
 * @returns {object} The schedule as the API returns it.
 * @example
 * formatSchedule(await db.ThermostatSchedule.findByPk(id, { include: SCHEDULE_INCLUDE }), 'Europe/Paris');
 */
function formatSchedule(schedule, timezone) {
  const plain = schedule.get({ plain: true });
  const transitions = plain.transitions.map(({ day_of_week: dayOfWeek, time, preset }) => ({
    day_of_week: dayOfWeek,
    time,
    preset,
  }));
  const { dayOfWeek, currentMinutes } = getCurrentDayAndMinutes(new Date(), timezone);
  return {
    id: plain.id,
    selector: plain.selector,
    name: plain.name,
    // house_id is NOT NULL with a cascade, and the include is always present, so
    // the house is always there — unlike the room, which a device may not have.
    house: plain.house.selector,
    transitions,
    current: findCurrentTransition(transitions, dayOfWeek, currentMinutes),
    next: findNextTransition(transitions, dayOfWeek, currentMinutes),
    devices: plain.thermostats.map((link) => ({
      selector: link.device.selector,
      name: link.device.name,
      room: link.device.room ? link.device.room.selector : null,
    })),
  };
}

/**
 * @description The timezone the house's wall-clock times are resolved in, like
 * the regulation loop reads it. Null when it cannot be read, which leaves the
 * shared helper on its own default.
 * @returns {Promise<string|null>} The Gladys timezone.
 * @example
 * await getTimezone();
 */
async function getTimezone() {
  try {
    const timezone = await db.Variable.findOne({
      where: { name: SYSTEM_VARIABLE_NAMES.TIMEZONE, service_id: null },
    });
    return timezone ? timezone.value : null;
  } catch (e) {
    return null;
  }
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

  const [schedules, timezone] = await Promise.all([
    db.ThermostatSchedule.findAll({
      include,
      order: [['name', 'ASC'], ...TRANSITION_ORDER],
    }),
    getTimezone(),
  ]);
  return schedules.map((schedule) => formatSchedule(schedule, timezone));
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
  return formatSchedule(schedule, await getTimezone());
}

module.exports = { getSchedules, getScheduleBySelector, formatSchedule, SCHEDULE_INCLUDE, TRANSITION_ORDER };

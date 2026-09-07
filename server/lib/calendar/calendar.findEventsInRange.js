const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Find events starting in a given time range, in shared calendars.
 * @param {Array} calendars - Array of calendar selectors.
 * @param {Date} from - Start of the time range.
 * @param {Date} to - End of the time range.
 * @param {Date} [fullDayFrom] - Start of the time range to use for full-day events.
 * @param {Date} [fullDayTo] - End of the time range to use for full-day events.
 * @returns {Promise<Array>} Resolve with an array of events sorted by start date.
 * @example
 * gladys.calendar.findEventsInRange(calendars, from, to);
 */
async function findEventsInRange(calendars, from, to, fullDayFrom, fullDayTo) {
  // Full-day events are stored at midnight UTC, not at the local midnight of the house
  // timezone, so a caller working on calendar days can pass a dedicated range for them
  // (the UTC days covered by the local range) instead of the local bounds.
  const startCondition =
    fullDayFrom && fullDayTo
      ? {
          [Op.or]: [
            {
              full_day: false,
              start: {
                [Op.gte]: from,
                [Op.lte]: to,
              },
            },
            {
              full_day: true,
              start: {
                [Op.gte]: fullDayFrom,
                [Op.lte]: fullDayTo,
              },
            },
          ],
        }
      : {
          start: {
            [Op.gte]: from,
            [Op.lte]: to,
          },
        };
  const queryParams = {
    include: [
      {
        model: db.Calendar,
        as: 'calendar',
        include: [
          {
            model: db.User,
            as: 'creator',
            attributes: ['firstname', 'language'],
          },
        ],
      },
    ],
    where: {
      ...startCondition,
      '$calendar.selector$': {
        [Op.in]: calendars,
      },
      '$calendar.shared$': true,
    },
    order: [['start', 'ASC']],
  };
  const eventsMatching = await db.CalendarEvent.findAll(queryParams);

  return eventsMatching.map((event) => event.get({ plain: true }));
}

module.exports = {
  findEventsInRange,
};

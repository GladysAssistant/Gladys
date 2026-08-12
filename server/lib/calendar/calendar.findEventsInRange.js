const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Find events starting in a given time range, in shared calendars.
 * @param {Array} calendars - Array of calendar selectors.
 * @param {Date} from - Start of the time range.
 * @param {Date} to - End of the time range.
 * @returns {Promise<Array>} Resolve with an array of events sorted by start date.
 * @example
 * gladys.calendar.findEventsInRange(calendars, from, to);
 */
async function findEventsInRange(calendars, from, to) {
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
      start: {
        [Op.gte]: from,
        [Op.lte]: to,
      },
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

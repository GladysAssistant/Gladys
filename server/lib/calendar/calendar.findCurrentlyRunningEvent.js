const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Find currently running event.
 * @param {Array} calendars - Array of calendars.
 * @param {string} calendarEventNameComparator - Comparator with event name.
 * @param {string} calendarEventName - Name of the event to search.
 * @returns {Promise<Array>} Resolve with arrays of events.
 * @example
 * gladys.calendar.findCurrentlyRunningEvent(calendars, calendarEventNameComparator, calendarEventName);
 */
async function findCurrentlyRunningEvent(calendars, calendarEventNameComparator, calendarEventName) {
  const now = new Date();
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
        [Op.lte]: now,
      },
      end: {
        [Op.gte]: now,
      },
      '$calendar.selector$': {
        [Op.in]: calendars,
      },
      '$calendar.shared$': true,
    },
  };
  // eslint-disable-next-line default-case
  switch (calendarEventNameComparator) {
    // do nothing in that case
    case 'has-any-name':
      break;
    case 'is-exactly':
      // @ts-ignore
      queryParams.where.name = calendarEventName;
      break;
    case 'contains':
      // @ts-ignore
      queryParams.where.name = {
        [Op.like]: `%${calendarEventName}%`,
      };
      break;
    case 'starts-with':
      // @ts-ignore
      queryParams.where.name = {
        [Op.startsWith]: calendarEventName,
      };
      break;
    case 'ends-with':
      // @ts-ignore
      queryParams.where.name = {
        [Op.endsWith]: calendarEventName,
      };
      break;
  }
  // we search in the database if we find events that match our request
  const eventsMatching = await db.CalendarEvent.findAll(queryParams);

  return eventsMatching.map((event) => event.get({ plain: true }));
}

module.exports = {
  findCurrentlyRunningEvent,
};

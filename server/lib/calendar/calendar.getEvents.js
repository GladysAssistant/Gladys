const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Get calendar events
 * @param {string} userId - The user id.
 * @param {Object} options - Options of the query.
 * @example
 * gladys.calendar.getEvents();
 */
async function getEvents(userId, options) {
  const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
  // Default from date is one week ago
  const fromDate = options.from ? new Date(options.from) : new Date(oneWeekAgo);
  // default end date is now
  const toDate = options.to ? new Date(options.to) : new Date();
  const calendarEvents = await db.CalendarEvent.findAll({
    include: [
      {
        model: db.Calendar,
        as: 'calendar',
        attributes: ['name', 'selector'],
        where: {
          user_id: userId,
        },
      },
    ],
    where: {
      start: {
        [Op.gte]: new Date(fromDate),
        [Op.lte]: new Date(toDate),
      },
    },
  });

  const plainCalendarEvents = calendarEvents.map((calendarEvent) => calendarEvent.get({ plain: true }));

  return plainCalendarEvents;
}

module.exports = {
  getEvents,
};

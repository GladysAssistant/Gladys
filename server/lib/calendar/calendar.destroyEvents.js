const { Op } = require('sequelize');
const db = require('../../models');

/**
 * @description Delete events from a calendar.
 * @param {string} calendarId - Calendar id to empty.
 * @param {object} options - Options of the query.
 * @example
 * gladys.calendar.destroyEvents('0dc03aef-4a23-9c4e-88e3-5437971269e5', {url: '/calendar/event.ics'});
 */
async function destroyEvents(calendarId, options = {}) {
  const where = {
    calendar_id: calendarId,
  };

  if (options.url) {
    where.url = {
      [Op.eq]: options.url,
    };
  }

  if (options.from) {
    where.start = {
      [Op.gte]: new Date(options.from),
    };
  }

  await db.CalendarEvent.destroy({ where });
}

module.exports = {
  destroyEvents,
};

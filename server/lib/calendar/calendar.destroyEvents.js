const db = require('../../models');

/**
 * @description Delete events from a calendar.
 * @param {string} calendarId - Calendar id to empty.
 * @example
 * gladys.calendar.destroyEvents('0dc03aef-4a23-9c4e-88e3-5437971269e5');
 */
async function destroyEvents(calendarId) {
  await db.CalendarEvent.destroy({
    where: {
      calendar_id: calendarId,
    },
  });
}

module.exports = {
  destroyEvents,
};

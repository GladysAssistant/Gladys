const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Create an event in a calendar.
 * @param {string} calendarSelector - The selector of the calendar.
 * @param {object} calendarEvent - The event to create.
 * @returns {Promise<object>} Resolve with new event.
 * @example
 * gladys.calendar.createEvent('my-calendar', {
 *    name: 'test',
 *    start: '2019-02-12 07:49:07.556',
 * });
 */
async function createEvent(calendarSelector, calendarEvent) {
  const calendar = await db.Calendar.findOne({
    where: {
      selector: calendarSelector,
    },
  });

  if (calendar === null) {
    throw new NotFoundError('Calendar not found');
  }

  calendarEvent.calendar_id = calendar.id;
  const createdCalendarEvent = await db.CalendarEvent.create(calendarEvent);

  return createdCalendarEvent.get({ plain: true });
}

module.exports = {
  createEvent,
};

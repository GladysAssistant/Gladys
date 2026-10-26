const db = require('../../models');
const { assertNotReservedExternalId } = require('./calendar.reservedExternalId');
const { assertCalendarWritable } = require('./calendar.assertWritable');

/**
 * @description Create an event in a calendar.
 * @param {string} calendarSelector - The selector of the calendar.
 * @param {object} calendarEvent - The event to create.
 * @param {string} [userId] - When provided, the calendar must be writable by this user (assertCalendarWritable).
 * @returns {Promise<object>} Resolve with new event.
 * @example
 * gladys.calendar.createEvent('my-calendar', {
 *    name: 'test',
 *    start: '2019-02-12 07:49:07.556',
 * });
 */
async function createEvent(calendarSelector, calendarEvent, userId) {
  // the external integrations write through upsertEvents, never here: an
  // event created by hand or by the CalDAV/webcal sync (whose UIDs the feed
  // controls) never squats one of their ids
  assertNotReservedExternalId(calendarEvent.external_id);
  const calendar = await db.Calendar.findOne({
    where: {
      selector: calendarSelector,
    },
  });

  assertCalendarWritable(calendar, userId, 'Calendar not found');

  calendarEvent.calendar_id = calendar.id;
  const createdCalendarEvent = await db.CalendarEvent.create(calendarEvent);

  return createdCalendarEvent.get({ plain: true });
}

module.exports = {
  createEvent,
};

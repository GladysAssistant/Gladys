const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { assertNotReservedExternalId } = require('./calendar.reservedExternalId');

/**
 * @description Create an event in a calendar.
 * @param {string} calendarSelector - The selector of the calendar.
 * @param {object} calendarEvent - The event to create.
 * @param {string} [userId] - When provided, the calendar must belong to this user.
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

  if (calendar === null || (userId !== undefined && calendar.user_id !== userId)) {
    throw new NotFoundError('Calendar not found');
  }

  calendarEvent.calendar_id = calendar.id;
  const createdCalendarEvent = await db.CalendarEvent.create(calendarEvent);

  return createdCalendarEvent.get({ plain: true });
}

module.exports = {
  createEvent,
};

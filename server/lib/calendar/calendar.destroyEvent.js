const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { assertCalendarWritable } = require('./calendar.assertWritable');

/**
 * @description Delete a calendar event.
 * @param {string} selector - CalendarEvent selector.
 * @param {string} [userId] - When provided, the event's calendar must be writable by this user.
 * @example
 * gladys.calendar.destroyEvent('my-event');
 */
async function destroyEvent(selector, userId) {
  const calendarEvent = await db.CalendarEvent.findOne({
    where: {
      selector,
    },
    include: [
      {
        model: db.Calendar,
        as: 'calendar',
        attributes: ['user_id', 'shared'],
        // INNER JOIN: an event without its calendar is "not found", never a
        // dereference of a missing association below
        required: true,
      },
    ],
  });

  if (calendarEvent === null) {
    throw new NotFoundError('CalendarEvent not found');
  }
  assertCalendarWritable(calendarEvent.calendar, userId, 'CalendarEvent not found');

  await calendarEvent.destroy();
}

module.exports = {
  destroyEvent,
};

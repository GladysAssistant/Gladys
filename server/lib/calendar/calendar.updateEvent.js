const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

// A user-initiated update only touches the editable fields of an event: the
// ownership columns (calendar_id, external_id, selector) stay out of reach, an
// event is never moved onto someone else's calendar. Internal callers (the
// CalDAV sync) pass no userId and keep writing the full row.
const USER_EDITABLE_FIELDS = ['name', 'start', 'end', 'full_day', 'location', 'description', 'url'];

/**
 * @description Update a calendar event.
 * @param {string} selector - CalendarEvent selector.
 * @param {object} calendarEvent - The new event.
 * @param {string} [userId] - When set, the calendar must belong to this user and only the editable fields are written.
 * @returns {Promise<object>} Resolve with updated event.
 * @example
 * gladys.calendar.updateEvent('my-event', {
 *    name: 'New name',
 * });
 */
async function updateEvent(selector, calendarEvent, userId) {
  const existingCalendarEvent = await db.CalendarEvent.findOne({
    where: {
      selector,
    },
    include: [
      {
        model: db.Calendar,
        as: 'calendar',
        attributes: ['user_id'],
        // INNER JOIN: an event without its calendar is "not found", never a
        // dereference of a missing association below
        required: true,
      },
    ],
  });

  if (existingCalendarEvent === null || (userId !== undefined && existingCalendarEvent.calendar.user_id !== userId)) {
    throw new NotFoundError('CalendarEvent not found');
  }

  await existingCalendarEvent.update(
    calendarEvent,
    userId !== undefined ? { fields: USER_EDITABLE_FIELDS } : undefined,
  );

  return existingCalendarEvent.get({ plain: true });
}

module.exports = {
  updateEvent,
};

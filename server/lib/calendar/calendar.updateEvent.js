const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a calendar event.
 * @param {string} selector - CalendarEvent selector.
 * @param {object} calendarEvent - The new event.
 * @param {string} [userId] - When provided, the event's calendar must belong to this user.
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
      },
    ],
  });

  if (
    existingCalendarEvent === null ||
    (userId !== undefined && existingCalendarEvent.calendar.user_id !== userId)
  ) {
    throw new NotFoundError('CalendarEvent not found');
  }

  await existingCalendarEvent.update(calendarEvent);

  return existingCalendarEvent.get({ plain: true });
}

module.exports = {
  updateEvent,
};

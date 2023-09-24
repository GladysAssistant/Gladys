const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a calendar event.
 * @param {string} selector - CalendarEvent selector.
 * @param {object} calendarEvent - The new event.
 * @returns {Promise<object>} Resolve with updated event.
 * @example
 * gladys.calendar.updateEvent('my-event', {
 *    name: 'New name',
 * });
 */
async function updateEvent(selector, calendarEvent) {
  const existingCalendarEvent = await db.CalendarEvent.findOne({
    where: {
      selector,
    },
  });

  if (existingCalendarEvent === null) {
    throw new NotFoundError('CalendarEvent not found');
  }

  await existingCalendarEvent.update(calendarEvent);

  return existingCalendarEvent.get({ plain: true });
}

module.exports = {
  updateEvent,
};

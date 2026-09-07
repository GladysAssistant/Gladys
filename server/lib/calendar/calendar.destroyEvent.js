const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete a calendar event.
 * @param {string} selector - CalendarEvent selector.
 * @param {string} [userId] - When provided, the event's calendar must belong to this user.
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
        attributes: ['user_id'],
      },
    ],
  });

  if (calendarEvent === null || (userId !== undefined && calendarEvent.calendar.user_id !== userId)) {
    throw new NotFoundError('CalendarEvent not found');
  }

  await calendarEvent.destroy();
}

module.exports = {
  destroyEvent,
};

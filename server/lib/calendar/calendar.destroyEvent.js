const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Delete a calendar event.
 * @param {string} selector - CalendarEvent selector.
 * @example
 * gladys.calendar.destroyEvent('my-event');
 */
async function destroyEvent(selector) {
  const calendarEvent = await db.CalendarEvent.findOne({
    where: {
      selector,
    },
  });

  if (calendarEvent === null) {
    throw new NotFoundError('CalendarEvent not found');
  }

  await calendarEvent.destroy();
}

module.exports = {
  destroyEvent,
};

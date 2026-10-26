const db = require('../../models');
const { assertCalendarWritable } = require('./calendar.assertWritable');

/**
 * @description Delete a calendar.
 * @param {string} selector - Calendar selector.
 * @param {string} [userId] - When provided, the calendar must be writable by this user (assertCalendarWritable).
 * @example
 * gladys.calendar.destroy('my-calendar');
 */
async function destroy(selector, userId) {
  const calendar = await db.Calendar.findOne({
    where: {
      selector,
    },
  });

  assertCalendarWritable(calendar, userId, 'Calendar not found');

  await calendar.destroy();
}

module.exports = {
  destroy,
};

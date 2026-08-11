const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a calendar.
 * @param {string} selector - Calendar selector.
 * @param {object} calendar - The new calendar.
 * @param {string} [userId] - When provided, the calendar must belong to this user.
 * @returns {Promise<object>} Resolve with calendar updated.
 * @example
 * gladys.calendar.update('my-calendar', {
 *    name: 'New name',
 * });
 */
async function update(selector, calendar, userId) {
  const existingCalendar = await db.Calendar.findOne({
    where: {
      selector,
    },
  });

  // A calendar of another user answers like an unknown one: probing selectors
  // must reveal nothing.
  if (existingCalendar === null || (userId !== undefined && existingCalendar.user_id !== userId)) {
    throw new NotFoundError('Calendar not found');
  }

  await existingCalendar.update(calendar);

  return existingCalendar.get({ plain: true });
}

module.exports = {
  update,
};

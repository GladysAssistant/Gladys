const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a calendar.
 * @param {string} selector - Calendar selector.
 * @param {object} calendar - The new calendar.
 * @returns {Promise<object>} Resolve with calendar updated.
 * @example
 * gladys.calendar.update('my-calendar', {
 *    name: 'New name',
 * });
 */
async function update(selector, calendar) {
  const existingCalendar = await db.Calendar.findOne({
    where: {
      selector,
    },
  });

  if (existingCalendar === null) {
    throw new NotFoundError('Calendar not found');
  }

  await existingCalendar.update(calendar);

  return existingCalendar.get({ plain: true });
}

module.exports = {
  update,
};

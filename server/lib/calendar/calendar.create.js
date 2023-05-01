const db = require('../../models');

/**
 * @description Create a calendar.
 * @param {object} calendar - A calendar object.
 * @returns {Promise} Resolve with created calendar.
 * @example
 * gladys.calendar.create({
 *    name: 'Work',
 *    description: 'My work calendar',
 *    user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
 * })
 */
async function create(calendar) {
  const createdCalendar = await db.Calendar.create(calendar);
  return createdCalendar.get({ plain: true });
}

module.exports = {
  create,
};

const db = require('../../models');
const { assertNotReservedExternalId } = require('./calendar.reservedExternalId');

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
  // the external integrations write through upsertCalendars, never here
  assertNotReservedExternalId(calendar.external_id);
  const createdCalendar = await db.Calendar.create(calendar);
  return createdCalendar.get({ plain: true });
}

module.exports = {
  create,
};

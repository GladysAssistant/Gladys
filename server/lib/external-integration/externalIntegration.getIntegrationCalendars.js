const db = require('../../models');
const { BadParameters, ForbiddenError } = require('../../utils/coreErrors');
const { isCalendarIntegration } = require('./externalIntegration.getCalendarAccount');

/**
 * @description The integration's calendars (its own service_id rows only),
 * with the user-owned sync flag telling which calendars to skip. Without a
 * user filter, every enabled user's calendars come back in one call — the
 * startup resync.
 * @param {object} service - The external integration service (plain object).
 * @param {string} [userSelector] - Restrict to one user's calendars.
 * @returns {Promise<Array>} Resolve with the calendars.
 * @example
 * const calendars = await gladys.externalIntegration.getIntegrationCalendars(service, 'john');
 */
async function getIntegrationCalendars(service, userSelector) {
  if (!isCalendarIntegration(service.manifest)) {
    throw new ForbiddenError('CALENDAR_NOT_ALLOWED');
  }
  // ?user[]=a&user[]=b and ?user[x]=y reach the query parser as an array and an
  // object: they must never be handed to Sequelize as a where value
  if (userSelector !== undefined && (typeof userSelector !== 'string' || userSelector.length === 0)) {
    throw new BadParameters('user: must be a non-empty string');
  }
  const include = [
    {
      model: db.User,
      as: 'creator',
      attributes: ['selector'],
      ...(userSelector !== undefined ? { where: { selector: userSelector } } : {}),
    },
  ];
  const calendars = await db.Calendar.findAll({
    where: { service_id: service.id },
    include,
    order: [['name', 'ASC']],
  });
  return calendars.map((calendar) => ({
    user: calendar.creator.selector,
    external_id: calendar.external_id,
    selector: calendar.selector,
    name: calendar.name,
    description: calendar.description,
    color: calendar.color,
    sync: calendar.sync,
    shared: calendar.shared,
  }));
}

module.exports = {
  getIntegrationCalendars,
};

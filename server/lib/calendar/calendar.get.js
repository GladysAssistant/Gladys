const db = require('../../models');

/**
 * @description Get calendars
 * @param {string} userId - The id of the user.
 * @param {Object} options - Options of the query.
 * @example
 * gladys.calendar.get('f6cc6e0c-1b48-4b59-8ac7-9a0ad2e0ed3c');
 */
async function get(userId, options) {
  const where = {
    user_id: userId,
  };

  if (options.serviceId) {
    where.service_id = options.serviceId;
  }

  if (options.externalId) {
    where.external_id = options.externalId;
  }

  const calendars = await db.Calendar.findAll({ where });

  const plainCalendars = calendars.map((calendar) => calendar.get({ plain: true }));

  return plainCalendars;
}

module.exports = {
  get,
};

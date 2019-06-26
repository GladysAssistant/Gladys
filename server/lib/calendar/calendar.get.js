const db = require('../../models');

/**
 * @description Get calendars
 * @param {string} userId - The id of the user.
 * @example
 * gladys.calendar.get('f6cc6e0c-1b48-4b59-8ac7-9a0ad2e0ed3c');
 */
async function get(userId) {
  const calendars = await db.Calendar.findAll({
    where: {
      user_id: userId,
    },
  });

  const plainCalendars = calendars.map((calendar) => calendar.get({ plain: true }));

  return plainCalendars;
}

module.exports = {
  get,
};

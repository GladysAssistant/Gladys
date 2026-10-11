const { NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Check that a calendar of the CalDAV service belongs to the
 * user. The enable/disable routes are open to every user: each one acts on
 * their own CalDAV calendars only — another user's calendar, or a calendar of
 * another service (an external calendar integration), answers like an
 * unknown selector.
 * @param {object} gladys - The Gladys instance.
 * @param {string} serviceId - The id of the CalDAV service.
 * @param {string} selector - The calendar selector.
 * @param {string} userId - The id of the requesting user.
 * @returns {Promise} Resolve when the user owns the calendar.
 * @example
 * await assertOwnCalendar(this.gladys, this.serviceId, 'personnal', userId);
 */
async function assertOwnCalendar(gladys, serviceId, selector, userId) {
  const calendars = await gladys.calendar.get(userId, { selector, serviceId });
  if (!calendars.some((calendar) => calendar.user_id === userId)) {
    throw new NotFoundError('Calendar not found');
  }
}

module.exports = {
  assertOwnCalendar,
};

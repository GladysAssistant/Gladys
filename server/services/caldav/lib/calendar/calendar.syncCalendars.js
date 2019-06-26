const logger = require('../../../../utils/logger');

/**
 * @description Sync user calendars.
 * @param {Array} calendars - External calendars.
 * @param {Object} userId - Gladys calendar owner.
 * @returns {Promise} Resolving with all calendars sync.
 * @example
 * syncCalendars(calendars, userId)
 */
async function syncCalendars(calendars, userId) {
  logger.info(`CalDAV : Performing full sync of calendars.`);

  logger.info(`CalDAV : Syncing calendars, received ${calendars.length} calendars.`);

  // insert calendars in DB
  const formatedCalendars = this.formatCalendars(calendars, userId);
  const newCalendars = await Promise.all(
    formatedCalendars.map((formatedCalendar) => {
      return this.gladys.calendar.create(formatedCalendar);
    }),
  );

  logger.info(`CalDAV : Successfully inserted ${formatedCalendars.length} calendars in Gladys database.`);

  return newCalendars;
}

module.exports = {
  syncCalendars,
};

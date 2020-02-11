const logger = require('../../../../utils/logger');

/**
 * @description Delete all CalDAV calendars and events.
 * @param {Object} userId - Gladys user to clean up.
 * @returns {Promise} Resolving with client connected.
 * @example
 * config(user.id)
 */
async function cleanUp(userId) {
  logger.info(`Start cleaning CalDAV data for user: ${userId}`);
  const gladysCalendars = await this.gladys.calendar.get(userId, { serviceId: this.serviceId });
  logger.info(`${gladysCalendars.length} calendars to clean`);
  await Promise.all(
    gladysCalendars.map(async (calendar) => {
      const events = await this.gladys.calendar.getEvents(userId, {
        calendarId: calendar.id,
      });
      await Promise.all(events.map((event) => this.gladys.calendar.destroyEvent(event.selector)));
      return this.gladys.calendar.destroy(calendar.selector);
    }),
  );
}

module.exports = {
  cleanUp,
};

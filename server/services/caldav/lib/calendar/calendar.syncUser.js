const logger = require('../../../../utils/logger');

/**
 * @description Start user sync.
 * @param {Object} userId - Gladys user to connect & sync.
 * @returns {Promise} Resolving.
 * @example
 * syncUser(user.id)
 */
async function syncUser(userId) {
  const account = await this.connect(userId);

  // Clean all dav Calendar for full Sync
  let gladysCalendars = await this.gladys.calendar.get(userId);
  let davCalendars = gladysCalendars.filter((calendar) => calendar.service_id === this.serviceId);

  await Promise.all(
    davCalendars.map(async (calendar) => {
      const events = await this.gladys.calendar.getEvents(userId, {
        calendarId: calendar.id
      });

      await Promise.all(
        events.map(event => this.gladys.calendar.destroyEvent(event.selector)),
      );

      return this.gladys.calendar.destroy(calendar.selector);
    }),
  );

  await this.syncCalendars(account.calendars, userId);

  gladysCalendars = await this.gladys.calendar.get(userId);
  davCalendars = gladysCalendars.filter((calendar) => calendar.service_id === this.serviceId);
  // foreach calendar, sync events
  return Promise.all(
    davCalendars.map(async (davCalendar) => {
      try {
        const result = await this.syncCalendarEvents(
          davCalendar,
          account.calendars.filter((calendar) => davCalendar.external_id === calendar.url),
        );
        return result;
      } catch (err) {
        logger.warn(
          `CalDAV - Calendar : Failed to sync calendar ${davCalendar.name} with externalid ${
            davCalendar.external_id
          }. ${err}`,
        );
        return Promise.reject(err);
      }
    }),
  );
}

module.exports = {
  syncUser,
};

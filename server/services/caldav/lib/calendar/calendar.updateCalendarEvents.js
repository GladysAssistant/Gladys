const logger = require('../../../../utils/logger');

/**
 * @description Update Gladys calendars with the external calendars.
 * @param {Object} gladysCalendar - Gladys calendar to update.
 * @param {Object} calendars - Array of one calendar, containing calendar form caldav server.
 * @returns {Promise} Resolving with new events.
 * @example
 * updateCalendarEvents();
 */
async function updateCalendarEvents(gladysCalendar, calendars) {
  if (calendars.length !== 1) {
    return Promise.reject();
  }

  const events = calendars[0].objects;

  logger.info(`CalDAV : Performing full sync of ${gladysCalendar.name}, received ${events.length} events.`);

  // insert events in DB
  const formatedEvents = this.formatEvents(events, gladysCalendar);
  const newEvents = await Promise.all(
    formatedEvents.map((formatedEvent) => {
      return this.gladys.calendar.createEvent(gladysCalendar.selector, formatedEvent);
    }),
  );

  logger.info(
    `CalDAV : Successfully inserted ${formatedEvents.length} calendarEvents for ${gladysCalendar.name} in Gladys database.`,
  );

  return newEvents;
}

module.exports = {
  updateCalendarEvents,
};

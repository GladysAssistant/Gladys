const logger = require('../../../../utils/logger');

/**
 * @description Sync Gladys calendar to external calendar.
 * @param {Object} gladysCalendar - Gladys calendar to sync.
 * @param {Object} calendars - Array of one calendar, containing calendar form server.
 * @returns {Promise} Resolving with new events.
 * @example
 * syncCalendarEvents();
 */
async function syncCalendarEvents(gladysCalendar, calendars) {
  if (calendars.length !== 1) {
    return Promise.resolve();
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
    `CalDAV : Successfully inserted ${formatedEvents.length} calendarEvents for ${
      gladysCalendar.name
    } in Gladys database.`,
  );

  return newEvents;
}

module.exports = {
  syncCalendarEvents,
};

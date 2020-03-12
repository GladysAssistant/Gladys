const Promise = require('bluebird');
const logger = require('../../../../utils/logger');

/**
 * @description Start user's calendars synchronization.
 * @param {Object} userId - Gladys user to connect & synchronize.
 * @returns {Promise} Resolving.
 * @example
 * syncUserCalendars(user.id)
 */
async function syncUserCalendars(userId) {
  const CALDAV_HOST = await this.gladys.variable.getValue('CALDAV_HOST', this.serviceId, userId);
  const CALDAV_HOME_URL = await this.gladys.variable.getValue('CALDAV_HOME_URL', this.serviceId, userId);
  const CALDAV_USERNAME = await this.gladys.variable.getValue('CALDAV_USERNAME', this.serviceId, userId);
  const CALDAV_PASSWORD = await this.gladys.variable.getValue('CALDAV_PASSWORD', this.serviceId, userId);

  if (!CALDAV_HOST || !CALDAV_HOME_URL || !CALDAV_USERNAME || !CALDAV_PASSWORD) {
    throw new Error('CalDAV parameters must be setted and saved');
  }

  const xhr = new this.dav.transport.Basic(
    new this.dav.Credentials({
      username: CALDAV_USERNAME,
      password: CALDAV_PASSWORD,
    }),
  );

  // Get list of calendars
  let davCalendars;
  try {
    davCalendars = await this.requestCalendars(xhr, CALDAV_HOME_URL);
  } catch (e) {
    logger.error(e);
    throw new Error('Can\'t fetch calendars');
  }

  logger.info(`CalDAV : Found ${davCalendars.length} calendars.`);

  // Format all fetched calendars
  const formatedCalendars = this.formatCalendars(davCalendars, userId);
  const calendarsToUpdate = await Promise.all(
    formatedCalendars.map(async (formatedCalendar) => {
      const gladysCalendar = await this.gladys.calendar.get(userId, { externalId: formatedCalendar.external_id });
      // Create calendar if it does not already exist in database
      if (gladysCalendar.length === 0) {
        const savedCalendar = await this.gladys.calendar.create(formatedCalendar);
        delete savedCalendar.sync_token;
        return savedCalendar;
      }

      // Else update it if events change
      if (formatedCalendar.ctag !== gladysCalendar[0].ctag) {
        await this.gladys.calendar.update(gladysCalendar[0].selector, formatedCalendar);
        return gladysCalendar[0];
      }
      return null;
    }),
  );

  await Promise.map(
    calendarsToUpdate.filter((updatedCalendar) => updatedCalendar !== null),
    async (calendarToUpdate) => {
      // Get events that have changed
      let eventsToUpdate;
      try {
        eventsToUpdate = await this.requestChanges(xhr, calendarToUpdate);
      } catch (e) {
        logger.error(e);
        throw new Error('Can\'t fetch changes');
      }
      await Promise.all(
        eventsToUpdate.map(async (eventToUpdate) => {
          // Delete existing event if pops is empty
          if (JSON.stringify(eventToUpdate.props) === JSON.stringify({})) {
            const eventToDelete = await this.gladys.calendar.getEvents(userId, { url: eventToUpdate.href });
            if (eventToDelete.length === 1) {
              await this.gladys.calendar.destroyEvent(eventToDelete[0].selector);
            }
            return null;
          }
          return eventToUpdate;
        }),
      );

      if (
        eventsToUpdate.filter((eventToUpdate) => JSON.stringify(eventToUpdate.props) !== JSON.stringify({})).length ===
        0
      ) {
        return;
      }

      // Get event updates
      let jsonEvents;
      try {
        jsonEvents = await this.requestEventsData(xhr, calendarToUpdate.external_id, eventsToUpdate, CALDAV_HOST);
      } catch (e) {
        logger.error(e);
        throw new Error('Can\'t get events data');
      }

      const formatedEvents = this.formatEvents(jsonEvents, calendarToUpdate);

      const savedEvents = await Promise.all(
        formatedEvents.map(async (formatedEvent) => {
          const gladysEvents = await this.gladys.calendar.getEvents(userId, { externalId: formatedEvent.external_id });
          // Create event if it does not already exist in database
          if (gladysEvents.length === 0) {
            return this.gladys.calendar.createEvent(calendarToUpdate.selector, formatedEvent);
          }

          // Else update existing event
          return this.gladys.calendar.updateEvent(gladysEvents[0].selector, formatedEvent);
        }),
      );

      logger.info(`CalDAV : ${savedEvents.length} events updated.`);
    },
    { concurrency: 1 },
  );
}

module.exports = {
  syncUserCalendars,
};

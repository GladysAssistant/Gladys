const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError, NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Start user's calendars synchronization.
 * @param {object} userId - Gladys user to connect & synchronize.
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
    throw new ServiceNotConfiguredError('CALDAV_NOT_CONFIGURED');
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
    throw new NotFoundError('CALDAV_FAILED_REQUEST_CALENDARS');
  }

  logger.info(`CalDAV : Found ${davCalendars.length} calendars.`);

  // Format all fetched calendars
  const formatedCalendars = this.formatCalendars(davCalendars, userId);

  const calendarsToUpdate = await Promise.map(
    formatedCalendars,
    async (formatedCalendar) => {
      const gladysCalendar = await this.gladys.calendar.get(userId, { externalId: formatedCalendar.external_id });
      // Create calendar if it does not already exist in database
      if (gladysCalendar.length === 0) {
        const savedCalendar = await this.gladys.calendar.create(formatedCalendar);
        delete savedCalendar.sync_token;
        return savedCalendar;
      }

      // Else update it if sync is enable on calendar & events change
      if (gladysCalendar[0].sync && formatedCalendar.ctag !== gladysCalendar[0].ctag) {
        delete formatedCalendar.sync;
        await this.gladys.calendar.update(gladysCalendar[0].selector, formatedCalendar);
        return gladysCalendar[0];
      }
      return null;
    },
    { concurrency: 1 },
  );

  await Promise.map(
    calendarsToUpdate.filter((updatedCalendar) => updatedCalendar !== null && updatedCalendar.type === 'CALDAV'),
    async (calendarToUpdate) => {
      // Get events that have changed
      let eventsToUpdate;
      try {
        eventsToUpdate = await this.requestChanges(xhr, calendarToUpdate);
      } catch (e) {
        logger.error(e);
        throw new NotFoundError('CALDAV_FAILED_REQUEST_CHANGES');
      }

      await Promise.map(
        eventsToUpdate,
        async (eventToUpdate) => {
          // Delete existing event if props is empty
          if (JSON.stringify(eventToUpdate.props) === JSON.stringify({})) {
            const eventToDelete = await this.gladys.calendar.getEvents(userId, {
              url: encodeURIComponent(eventToUpdate.href).replace(/%2F/g, '/'),
            });
            if (eventToDelete.length === 1) {
              await this.gladys.calendar.destroyEvent(eventToDelete[0].selector);
            }
            return null;
          }
          return eventToUpdate;
        },
        { concurrency: 1 },
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
        throw new NotFoundError('CALDAV_FAILED_REQUEST_EVENTS');
      }

      const formatedEvents = this.formatEvents(jsonEvents, calendarToUpdate);

      let insertedOrUpdatedEvent = 0;

      await Promise.map(
        formatedEvents,
        async (formatedEvent) => {
          const gladysEvents = await this.gladys.calendar.getEvents(userId, { externalId: formatedEvent.external_id });
          try {
            // Create event if it does not already exist in database
            if (gladysEvents.length === 0) {
              await this.gladys.calendar.createEvent(calendarToUpdate.selector, formatedEvent);
            } else {
              // Else update existing event
              await this.gladys.calendar.updateEvent(gladysEvents[0].selector, formatedEvent);
            }

            insertedOrUpdatedEvent += 1;
          } catch (e) {
            logger.error(e);
          }
        },
        { concurrency: 1 },
      );
      logger.info(`CalDAV : ${insertedOrUpdatedEvent} events updated for calendar ${calendarToUpdate.name}.`);
    },
    { concurrency: 1 },
  );
}

module.exports = {
  syncUserCalendars,
};

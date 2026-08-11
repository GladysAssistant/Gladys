const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError, NotFoundError } = require('../../../../utils/coreErrors');
const { CALENDAR_TYPES } = require('../../../../utils/constants');

/**
 * @description Return the different URLs an event can be saved with in Gladys.
 * Depending on the CalDAV server, the href returned by the sync-collection report
 * can be already URL encoded or not, so both variants are needed to find an event.
 * @param {string} href - Href of the event returned by the CalDAV server.
 * @returns {Array} List of URLs to look for.
 * @example
 * getEventUrls('/calendars/tony/personal/event-1.ics')
 */
function getEventUrls(href) {
  const encodedHref = encodeURIComponent(href).replace(/%2F/g, '/');
  return href === encodedHref ? [href] : [href, encodedHref];
}

/**
 * @description Tell if a CalDAV resource was deleted on the server.
 * A deleted resource is returned by the sync-collection report without any property.
 * @param {object} event - Event returned by the sync-collection report.
 * @returns {boolean} True if the event was deleted on the CalDAV server.
 * @example
 * isDeletedEvent({ href: '/calendars/tony/personal/event-1.ics', props: {} })
 */
function isDeletedEvent(event) {
  return Object.keys(event.props).length === 0;
}

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
  const DISABLE_SSL_CHECK =
    ((await this.gladys.variable.getValue('CALDAV_CHECK_SSL', this.serviceId, userId)) || '1') === '0';

  if (!CALDAV_HOST || !CALDAV_HOME_URL || !CALDAV_USERNAME || !CALDAV_PASSWORD) {
    throw new ServiceNotConfiguredError('CALDAV_NOT_CONFIGURED');
  }

  const xhr = new this.dav.transport.Basic(
    new this.dav.Credentials({
      username: CALDAV_USERNAME,
      password: CALDAV_PASSWORD,
    }),
    {
      disableSSLCheck: DISABLE_SSL_CHECK,
    },
  );

  // Get list of calendars
  let davCalendars;
  try {
    davCalendars = await this.requestCalendars(xhr, CALDAV_HOME_URL);
  } catch (e) {
    logger.error(e);
    throw new NotFoundError({ message: 'CALDAV_FAILED_REQUEST_CALENDARS', log: e.stack });
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
        // The calendar is created without ctag & sync token, so a full sync is done.
        // They are saved only once the events have been successfully synchronized.
        const savedCalendar = await this.gladys.calendar.create({
          ...formatedCalendar,
          ctag: null,
          sync_token: null,
        });
        savedCalendar.newProperties = {
          ctag: formatedCalendar.ctag,
          sync_token: formatedCalendar.sync_token,
        };
        return savedCalendar;
      }

      // Else update it if sync is enable on calendar & events change
      if (gladysCalendar[0].sync && formatedCalendar.ctag !== gladysCalendar[0].ctag) {
        delete formatedCalendar.sync;
        // For a CalDAV calendar, the new ctag & sync token are saved only once the events
        // have been synchronized: if this sync fails, Gladys would otherwise consider the
        // calendar up to date and never fetch those changes again.
        if (gladysCalendar[0].type === CALENDAR_TYPES.CALDAV) {
          return { ...gladysCalendar[0], newProperties: formatedCalendar };
        }
        await this.gladys.calendar.update(gladysCalendar[0].selector, formatedCalendar);
        return gladysCalendar[0];
      }
      return null;
    },
    { concurrency: 1 },
  );

  await Promise.map(
    calendarsToUpdate.filter((updatedCalendar) => updatedCalendar !== null && updatedCalendar.type === CALENDAR_TYPES.CALDAV),
    async (calendarToUpdate) => {
      // Get events that have changed
      let eventsToUpdate;
      try {
        eventsToUpdate = await this.requestChanges(xhr, calendarToUpdate);
      } catch (e) {
        logger.error(e);
        throw new NotFoundError({ message: 'CALDAV_FAILED_REQUEST_CHANGES', log: e.stack });
      }

      const deletedEvents = eventsToUpdate.filter((eventToUpdate) => isDeletedEvent(eventToUpdate));
      const updatedEvents = eventsToUpdate.filter((eventToUpdate) => !isDeletedEvent(eventToUpdate));

      // Events already saved in Gladys for this calendar, so they can be compared
      // with what the CalDAV server returns without querying the database for each of them.
      const savedEvents =
        eventsToUpdate.length > 0
          ? await this.gladys.calendar.getEvents(userId, { calendarId: calendarToUpdate.id })
          : [];

      // Delete events removed on the CalDAV server.
      // A recurring event is saved as one Gladys event per occurrence, all sharing the same
      // URL, so every event matching this URL must be deleted, not only one.
      const deletedUrls = new Set(deletedEvents.reduce((urls, event) => urls.concat(getEventUrls(event.href)), []));
      const eventsToDelete = savedEvents.filter((savedEvent) => deletedUrls.has(savedEvent.url));

      let deletedEventCount = 0;

      await Promise.map(
        eventsToDelete,
        async (eventToDelete) => {
          await this.gladys.calendar.destroyEvent(eventToDelete.selector);
          deletedEventCount += 1;
        },
        { concurrency: 1 },
      );

      let insertedOrUpdatedEvent = 0;

      if (updatedEvents.length > 0) {
        // Get event updates
        let jsonEvents;
        try {
          jsonEvents = await this.requestEventsData(xhr, calendarToUpdate.external_id, updatedEvents, CALDAV_HOST);
        } catch (e) {
          logger.error(e);
          throw new NotFoundError({ message: 'CALDAV_FAILED_REQUEST_EVENTS', log: e.stack });
        }

        const formatedEvents = this.formatEvents(jsonEvents, calendarToUpdate);

        await Promise.map(
          formatedEvents,
          async (formatedEvent) => {
            const gladysEvents = await this.gladys.calendar.getEvents(userId, {
              externalId: formatedEvent.external_id,
            });
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

        // Occurrences of a recurring event that do not exist anymore on the CalDAV server
        // (recurrence rule shortened, occurrence deleted, exception date added...) are still
        // saved in Gladys: as events are only created or updated above, they must be removed here.
        const upToDateExternalIds = new Set(formatedEvents.map((formatedEvent) => formatedEvent.external_id));
        const updatedUrls = new Set(jsonEvents.map((jsonEvent) => jsonEvent.href).filter((href) => href));
        const outdatedEvents = savedEvents.filter(
          (savedEvent) => updatedUrls.has(savedEvent.url) && !upToDateExternalIds.has(savedEvent.external_id),
        );

        await Promise.map(
          outdatedEvents,
          async (outdatedEvent) => {
            await this.gladys.calendar.destroyEvent(outdatedEvent.selector);
            deletedEventCount += 1;
          },
          { concurrency: 1 },
        );
      }

      logger.info(
        `CalDAV : ${insertedOrUpdatedEvent} events updated, ${deletedEventCount} events deleted for calendar ${calendarToUpdate.name}.`,
      );

      // Every change was applied, the calendar can now be marked as up to date.
      if (calendarToUpdate.newProperties) {
        await this.gladys.calendar.update(calendarToUpdate.selector, calendarToUpdate.newProperties);
      }
    },
    { concurrency: 1 },
  );
}

module.exports = {
  syncUserCalendars,
};

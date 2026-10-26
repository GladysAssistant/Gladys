const Promise = require('bluebird');
const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError, NotFoundError } = require('../../../../utils/coreErrors');
const { CALENDAR_TYPES } = require('../../../../utils/constants');

// Recurring events are expanded over [now - 1 year, now + 2 years]: refreshing them once a month
// keeps their future occurrences synchronized long before this time range runs out.
const RECURRING_EVENTS_REFRESH_INTERVAL_DAYS = 30;

// HTTP status returned by a CalDAV server which does not support a request, as reported by dav-request.
// A server which does not support a filter must answer 403 (RFC 4791, section 7.7).
const UNSUPPORTED_REQUEST_ERROR_REGEX = /^Bad status: (400|403|415|501)$/;

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
 * @description Tell if the occurrences of the recurring events of a calendar must be computed again.
 * Recurring events are expanded over a limited time range when they are synchronized: an event that is never
 * modified on the CalDAV server is never synchronized again, so its occurrences must be refreshed periodically.
 * @param {object} dayjs - Dayjs instance to use.
 * @param {object} calendar - Gladys calendar.
 * @returns {boolean} True if the recurring events of the calendar must be refreshed.
 * @example
 * isRecurringEventsRefreshDue(dayjs, { last_sync: '2026-01-01T00:00:00+01:00' })
 */
function isRecurringEventsRefreshDue(dayjs, calendar) {
  return (
    !calendar.last_sync ||
    dayjs(calendar.last_sync).isBefore(dayjs().subtract(RECURRING_EVENTS_REFRESH_INTERVAL_DAYS, 'days'))
  );
}

/**
 * @description Save CalDAV events in a Gladys calendar: create or update them, and delete the
 * occurrences of their recurring events which do not exist anymore.
 * @param {string} userId - Gladys user, calendar owner.
 * @param {object} calendar - Gladys calendar where events are saved.
 * @param {Array} jsonEvents - Events returned by the CalDAV server.
 * @param {Array} savedEvents - Events already saved in Gladys for this calendar.
 * @returns {Promise<object>} Resolving with the number of inserted or updated events and of deleted events.
 * @example
 * saveEvents.call(caldavHandler, userId, calendar, jsonEvents, savedEvents)
 */
async function saveEvents(userId, calendar, jsonEvents, savedEvents) {
  let insertedOrUpdatedEvent = 0;
  let deletedEventCount = 0;

  const failedEvents = [];
  const formatedEvents = this.formatEvents(jsonEvents, calendar, failedEvents);
  // URLs of the events which could not be formatted or saved: their occurrences already saved in Gladys are kept
  const failedUrls = new Set(failedEvents.map((failedEvent) => failedEvent.href));

  await Promise.map(
    formatedEvents,
    async (formatedEvent) => {
      const gladysEvents = await this.gladys.calendar.getEvents(userId, {
        externalId: formatedEvent.external_id,
      });
      try {
        // Create event if it does not already exist in database
        if (gladysEvents.length === 0) {
          await this.gladys.calendar.createEvent(calendar.selector, formatedEvent);
        } else {
          // Else update existing event
          await this.gladys.calendar.updateEvent(gladysEvents[0].selector, formatedEvent);
        }

        insertedOrUpdatedEvent += 1;
      } catch (e) {
        logger.error(e);
        failedUrls.add(formatedEvent.url);
      }
    },
    { concurrency: 1 },
  );

  // Occurrences of a recurring event that do not exist anymore on the CalDAV server
  // (recurrence rule shortened, occurrence deleted, exception date added, occurrence now out of
  // the synchronized time range...) are still saved in Gladys: as events are only created or updated above,
  // they must be removed here.
  // Events that could not be formatted were skipped: they are missing from formatedEvents although
  // they still exist on the CalDAV server, so the version already saved in Gladys is kept.
  // Likewise, when an occurrence could not be saved (an occurrence moved to another time gets a new external id),
  // the occurrences already saved for this event are kept rather than deleted without replacement.
  const upToDateExternalIds = new Set(formatedEvents.map((formatedEvent) => formatedEvent.external_id));
  const updatedUrls = new Set(
    jsonEvents.map((jsonEvent) => jsonEvent.href).filter((href) => href && !failedUrls.has(href)),
  );
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

  return { insertedOrUpdatedEvent, deletedEventCount };
}

/**
 * @description Synchronize the events of a CalDAV calendar that changed since a sync token.
 * Without sync token, every event of the calendar is synchronized.
 * @param {string} userId - Gladys user, calendar owner.
 * @param {object} xhr - Request with dav credentials.
 * @param {string} calDavHost - CalDAV server host.
 * @param {object} calendar - Gladys calendar to synchronize.
 * @param {string} syncToken - Sync token of the last synchronization.
 * @returns {Promise} Resolving once the events are synchronized.
 * @example
 * syncEvents.call(caldavHandler, userId, xhr, CALDAV_HOST, calendar, calendar.sync_token)
 */
async function syncEvents(userId, xhr, calDavHost, calendar, syncToken) {
  // Get events that have changed
  let eventsToUpdate;
  try {
    eventsToUpdate = await this.requestChanges(xhr, { ...calendar, sync_token: syncToken });
  } catch (e) {
    logger.error(e);
    throw new NotFoundError({ message: 'CALDAV_FAILED_REQUEST_CHANGES', log: e.stack });
  }

  const deletedEvents = eventsToUpdate.filter((eventToUpdate) => isDeletedEvent(eventToUpdate));
  const updatedEvents = eventsToUpdate.filter((eventToUpdate) => !isDeletedEvent(eventToUpdate));

  // Events already saved in Gladys for this calendar, so they can be compared
  // with what the CalDAV server returns without querying the database for each of them.
  const savedEvents =
    eventsToUpdate.length > 0 ? await this.gladys.calendar.getEvents(userId, { calendarId: calendar.id }) : [];

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
      jsonEvents = await this.requestEventsData(xhr, calendar.external_id, updatedEvents, calDavHost);
    } catch (e) {
      logger.error(e);
      throw new NotFoundError({ message: 'CALDAV_FAILED_REQUEST_EVENTS', log: e.stack });
    }

    const savedCount = await saveEvents.call(this, userId, calendar, jsonEvents, savedEvents);
    insertedOrUpdatedEvent += savedCount.insertedOrUpdatedEvent;
    deletedEventCount += savedCount.deletedEventCount;
  }

  logger.info(
    `CalDAV : ${insertedOrUpdatedEvent} events updated, ${deletedEventCount} events deleted for calendar ${calendar.name}.`,
  );
}

/**
 * @description Compute again the occurrences of the recurring events of a CalDAV calendar,
 * so that they keep covering the synchronized time range even if they are never modified.
 * Only the recurring events are requested to the CalDAV server. If the server does not support
 * this request, every event of the calendar is synchronized instead. After any other error
 * (network, server error...), the refresh is skipped and retried at the next synchronization.
 * @param {string} userId - Gladys user, calendar owner.
 * @param {object} xhr - Request with dav credentials.
 * @param {string} calDavHost - CalDAV server host.
 * @param {object} calendar - Gladys calendar to refresh.
 * @returns {Promise<boolean>} Resolving with true if the recurring events were refreshed.
 * @example
 * refreshRecurringEvents.call(caldavHandler, userId, xhr, CALDAV_HOST, calendar)
 */
async function refreshRecurringEvents(userId, xhr, calDavHost, calendar) {
  let jsonEvents;
  try {
    jsonEvents = await this.requestRecurringEvents(xhr, calendar.external_id);
  } catch (e) {
    if (!UNSUPPORTED_REQUEST_ERROR_REGEX.test(e.message)) {
      logger.warn(
        `CalDAV : unable to request the recurring events of calendar ${calendar.name}, the refresh will be retried at the next synchronization. ${e.message}`,
      );
      return false;
    }
    logger.warn(
      `CalDAV : the server does not support requesting the recurring events of calendar ${calendar.name}, synchronizing all its events instead. ${e.message}`,
    );
    await syncEvents.call(this, userId, xhr, calDavHost, calendar, null);
    return true;
  }

  // A server which does not support the RRULE filter can return every event of the calendar
  const recurringEvents = jsonEvents.filter((jsonEvent) => jsonEvent.rrule !== undefined);

  const savedEvents =
    recurringEvents.length > 0 ? await this.gladys.calendar.getEvents(userId, { calendarId: calendar.id }) : [];

  const { insertedOrUpdatedEvent, deletedEventCount } = await saveEvents.call(
    this,
    userId,
    calendar,
    recurringEvents,
    savedEvents,
  );

  logger.info(
    `CalDAV : ${recurringEvents.length} recurring events refreshed (${insertedOrUpdatedEvent} occurrences updated, ${deletedEventCount} occurrences deleted) for calendar ${calendar.name}.`,
  );
  return true;
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
        if (formatedCalendar.type !== CALENDAR_TYPES.CALDAV) {
          await this.gladys.calendar.create(formatedCalendar);
          return null;
        }
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
        savedCalendar.syncChanges = true;
        return savedCalendar;
      }

      if (!gladysCalendar[0].sync) {
        return null;
      }

      const ctagChanged = formatedCalendar.ctag !== gladysCalendar[0].ctag;
      delete formatedCalendar.sync;

      // For a CalDAV calendar, the new ctag & sync token are saved only once the events
      // have been synchronized: if this sync fails, Gladys would otherwise consider the
      // calendar up to date and never fetch those changes again.
      if (gladysCalendar[0].type === CALENDAR_TYPES.CALDAV) {
        const refreshDue = isRecurringEventsRefreshDue(this.dayjs, gladysCalendar[0]);
        if (!ctagChanged && !refreshDue) {
          return null;
        }
        return {
          ...gladysCalendar[0],
          newProperties: ctagChanged ? formatedCalendar : {},
          syncChanges: ctagChanged,
          refreshRecurringEvents: refreshDue,
        };
      }

      // Else update it if events change
      if (ctagChanged) {
        await this.gladys.calendar.update(gladysCalendar[0].selector, formatedCalendar);
      }
      return null;
    },
    { concurrency: 1 },
  );

  await Promise.map(
    calendarsToUpdate.filter((calendarToUpdate) => calendarToUpdate !== null),
    async (calendarToUpdate) => {
      const { newProperties } = calendarToUpdate;
      // Without sync token, every event of the calendar is synchronized, so the occurrences
      // of all its recurring events are computed again.
      const fullSync = calendarToUpdate.syncChanges && !calendarToUpdate.sync_token;

      if (calendarToUpdate.syncChanges) {
        await syncEvents.call(this, userId, xhr, CALDAV_HOST, calendarToUpdate, calendarToUpdate.sync_token);
      }

      let recurringEventsRefreshed = fullSync;
      if (calendarToUpdate.refreshRecurringEvents && !fullSync) {
        // The refresh is a periodic maintenance: if it fails, the changes are still saved & the other
        // calendars still synchronized, and the refresh is retried at the next synchronization.
        try {
          recurringEventsRefreshed = await refreshRecurringEvents.call(
            this,
            userId,
            xhr,
            CALDAV_HOST,
            calendarToUpdate,
          );
        } catch (e) {
          logger.warn(
            `CalDAV : unable to refresh the recurring events of calendar ${calendarToUpdate.name}, the refresh will be retried at the next synchronization.`,
            e,
          );
        }
      }

      if (recurringEventsRefreshed) {
        newProperties.last_sync = this.dayjs().format();
      }

      // Every change was applied, the calendar can now be marked as up to date. Events that could not be
      // formatted keep their previous version: fetching them again at each synchronization would not fix them.
      if (Object.keys(newProperties).length > 0) {
        await this.gladys.calendar.update(calendarToUpdate.selector, newProperties);
      }
    },
    { concurrency: 1 },
  );
}

module.exports = {
  syncUserCalendars,
};
